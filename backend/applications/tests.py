from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from jobs.models import Job
from notifications.models import Notification

from .models import Application


User = get_user_model()


class ApplicationAPITestCase(APITestCase):
    def setUp(self):
        self.student = User.objects.create_user(
            username="student_test",
            email="student@example.com",
            password="StrongPassword123!",
            role="student",
        )

        self.other_student = User.objects.create_user(
            username="other_student",
            email="otherstudent@example.com",
            password="StrongPassword123!",
            role="student",
        )

        self.company = User.objects.create_user(
            username="company_test",
            email="company@example.com",
            password="StrongPassword123!",
            role="company",
        )

        self.other_company = User.objects.create_user(
            username="other_company",
            email="othercompany@example.com",
            password="StrongPassword123!",
            role="company",
        )

        self.job = Job.objects.create(
            company=self.company,
            title_en="Frontend Developer",
            title_ja=(
                "フロントエンドエンジニア"
            ),
            description_en=(
                "Build responsive web applications."
            ),
            description_ja=(
                "レスポンシブなWebアプリを開発します。"
            ),
            requirements=(
                "React, JavaScript, HTML, CSS"
            ),
            location="Osaka, Japan",
            employment_type="full_time",
            workplace_type="hybrid",
            japanese_level="n2",
            salary_min=250000,
            salary_max=350000,
            is_active=True,
        )

    def create_application(
        self,
        applicant=None,
        status_value=Application.Status.PENDING,
    ):
        return Application.objects.create(
            job=self.job,
            applicant=applicant or self.student,
            cover_letter=(
                "I am interested in this position."
            ),
            status=status_value,
        )

    def authenticate(self, user):
        self.client.force_authenticate(user=user)

    def test_student_can_apply_for_job(self):
        self.authenticate(self.student)

        url = reverse("application-list")

        response = self.client.post(
            url,
            {
                "job": self.job.id,
                "cover_letter": (
                    "I would like to apply."
                ),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertTrue(
            Application.objects.filter(
                job=self.job,
                applicant=self.student,
            ).exists()
        )

    def test_student_cannot_apply_twice(self):
        self.create_application()
        self.authenticate(self.student)

        url = reverse("application-list")

        response = self.client.post(
            url,
            {
                "job": self.job.id,
                "cover_letter": (
                    "Applying for the same job again."
                ),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertEqual(
            Application.objects.filter(
                job=self.job,
                applicant=self.student,
            ).count(),
            1,
        )

    def test_company_can_update_application_status(self):
        application = self.create_application()
        self.authenticate(self.company)

        url = reverse(
            "application-detail",
            args=[application.id],
        )

        response = self.client.patch(
            url,
            {"status": "interview"},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        application.refresh_from_db()

        self.assertEqual(
            application.status,
            Application.Status.INTERVIEW,
        )

    def test_status_update_creates_notification(self):
        application = self.create_application()
        self.authenticate(self.company)

        url = reverse(
            "application-detail",
            args=[application.id],
        )

        response = self.client.patch(
            url,
            {"status": "interview"},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        notification = Notification.objects.get(
            recipient=self.student,
            application=application,
        )

        self.assertFalse(notification.is_read)

        self.assertIn(
            "Interview",
            notification.message_en,
        )

        self.assertIn(
            "面接",
            notification.message_ja,
        )

    def test_same_status_does_not_create_notification(
        self,
    ):
        application = self.create_application()
        self.authenticate(self.company)

        url = reverse(
            "application-detail",
            args=[application.id],
        )

        response = self.client.patch(
            url,
            {"status": "pending"},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertFalse(
            Notification.objects.filter(
                application=application,
            ).exists()
        )

    def test_other_company_cannot_update_application(
        self,
    ):
        application = self.create_application()
        self.authenticate(self.other_company)

        url = reverse(
            "application-detail",
            args=[application.id],
        )

        response = self.client.patch(
            url,
            {"status": "accepted"},
            format="json",
        )

        self.assertIn(
            response.status_code,
            (
                status.HTTP_403_FORBIDDEN,
                status.HTTP_404_NOT_FOUND,
            ),
        )

        application.refresh_from_db()

        self.assertEqual(
            application.status,
            Application.Status.PENDING,
        )

    def test_student_cannot_update_company_status(self):
        application = self.create_application()
        self.authenticate(self.student)

        url = reverse(
            "application-detail",
            args=[application.id],
        )

        response = self.client.patch(
            url,
            {"status": "accepted"},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_student_can_withdraw_application(self):
        application = self.create_application()
        self.authenticate(self.student)

        url = reverse(
            "application-withdraw",
            args=[application.id],
        )

        response = self.client.post(
            url,
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        application.refresh_from_db()

        self.assertEqual(
            application.status,
            Application.Status.WITHDRAWN,
        )

    def test_other_student_cannot_withdraw_application(
        self,
    ):
        application = self.create_application()
        self.authenticate(self.other_student)

        url = reverse(
            "application-withdraw",
            args=[application.id],
        )

        response = self.client.post(
            url,
            {},
            format="json",
        )

        self.assertIn(
            response.status_code,
            (
                status.HTTP_403_FORBIDDEN,
                status.HTTP_404_NOT_FOUND,
            ),
        )

        application.refresh_from_db()

        self.assertEqual(
            application.status,
            Application.Status.PENDING,
        )

    def test_completed_application_cannot_be_withdrawn(
        self,
    ):
        application = self.create_application(
            status_value=Application.Status.ACCEPTED,
        )

        self.authenticate(self.student)

        url = reverse(
            "application-withdraw",
            args=[application.id],
        )

        response = self.client.post(
            url,
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        application.refresh_from_db()

        self.assertEqual(
            application.status,
            Application.Status.ACCEPTED,
        )


class NotificationAPITestCase(APITestCase):
    def setUp(self):
        self.student = User.objects.create_user(
            username="notification_student",
            email="notification@example.com",
            password="StrongPassword123!",
            role="student",
        )

        self.other_student = User.objects.create_user(
            username="other_notification_student",
            email="othernotification@example.com",
            password="StrongPassword123!",
            role="student",
        )

        self.company = User.objects.create_user(
            username="notification_company",
            email="notificationcompany@example.com",
            password="StrongPassword123!",
            role="company",
        )

        self.job = Job.objects.create(
            company=self.company,
            title_en="React Developer",
            description_en="Build React applications.",
            requirements="React and JavaScript",
            location="Osaka, Japan",
            employment_type="full_time",
            workplace_type="hybrid",
            japanese_level="n2",
            is_active=True,
        )

        self.application = Application.objects.create(
            job=self.job,
            applicant=self.student,
            cover_letter="Please consider my application.",
        )

        self.notification = Notification.objects.create(
            recipient=self.student,
            application=self.application,
            title_en="Application status updated",
            title_ja="応募状況が更新されました",
            message_en=(
                "Your application is now Interview."
            ),
            message_ja=(
                "応募状況が「面接」に更新されました。"
            ),
        )

        self.other_notification = (
            Notification.objects.create(
                recipient=self.other_student,
                title_en="Other notification",
                title_ja="他の通知",
                message_en="This belongs to another user.",
                message_ja="これは別のユーザーの通知です。",
            )
        )

    def authenticate_student(self):
        self.client.force_authenticate(
            user=self.student,
        )

    def test_user_only_sees_own_notifications(self):
        self.authenticate_student()

        url = reverse("notification-list")
        response = self.client.get(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        notification_ids = [
            item["id"]
            for item in response.data
        ]

        self.assertIn(
            self.notification.id,
            notification_ids,
        )

        self.assertNotIn(
            self.other_notification.id,
            notification_ids,
        )

    def test_unread_count_is_correct(self):
        self.authenticate_student()

        url = reverse(
            "notification-unread-count",
        )

        response = self.client.get(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["count"],
            1,
        )

    def test_user_can_mark_notification_as_read(self):
        self.authenticate_student()

        url = reverse(
            "notification-mark-as-read",
            args=[self.notification.id],
        )

        response = self.client.patch(
            url,
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.notification.refresh_from_db()

        self.assertTrue(
            self.notification.is_read,
        )

    def test_user_cannot_read_other_notification(self):
        self.authenticate_student()

        url = reverse(
            "notification-mark-as-read",
            args=[self.other_notification.id],
        )

        response = self.client.patch(
            url,
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

        self.other_notification.refresh_from_db()

        self.assertFalse(
            self.other_notification.is_read,
        )

    def test_user_can_mark_all_notifications_as_read(
        self,
    ):
        Notification.objects.create(
            recipient=self.student,
            title_en="Second notification",
            title_ja="2件目の通知",
            message_en="Another update.",
            message_ja="別の更新です。",
        )

        self.authenticate_student()

        url = reverse(
            "notification-mark-all-as-read",
        )

        response = self.client.patch(
            url,
            {},
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["updated"],
            2,
        )

        self.assertFalse(
            Notification.objects.filter(
                recipient=self.student,
                is_read=False,
            ).exists()
        )