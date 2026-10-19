from datetime import timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from profiles.models import (
    CompanyProfile,
    StudentProfile,
)

from .models import Job, SavedJob


User = get_user_model()


class JobAPITestCase(APITestCase):
    def setUp(self):
        self.student = User.objects.create_user(
            username="student_test",
            email="student@example.com",
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
            email="other@example.com",
            password="StrongPassword123!",
            role="company",
        )

        self.unverified_company = (
            User.objects.create_user(
                username="unverified_company",
                email="unverified@example.com",
                password="StrongPassword123!",
                role="company",
            )
        )

        CompanyProfile.objects.update_or_create(
            user=self.company,
            defaults={
                "company_name": (
                    "CareerBridge Tech"
                ),
                "website": (
                    "https://careerbridge.example.com"
                ),
                "location": "Osaka, Japan",
                "registration_number": (
                    "TEST-COMPANY-001"
                ),
                "contact_person": (
                    "Test Recruiter"
                ),
                "verification_status": (
                    CompanyProfile
                    .VerificationStatus
                    .VERIFIED
                ),
                "verified_at": timezone.now(),
            },
        )
        self.company.refresh_from_db()
        self.other_company.refresh_from_db()
        self.unverified_company.refresh_from_db()
        CompanyProfile.objects.update_or_create(
            user=self.other_company,
            defaults={
                "company_name": (
                    "Other Test Company"
                ),
                "website": (
                    "https://other-company.example.com"
                ),
                "location": "Tokyo, Japan",
                "registration_number": (
                    "TEST-COMPANY-002"
                ),
                "contact_person": (
                    "Other Recruiter"
                ),
                "verification_status": (
                    CompanyProfile
                    .VerificationStatus
                    .VERIFIED
                ),
                "verified_at": timezone.now(),
            },
        )

        CompanyProfile.objects.update_or_create(
            user=self.unverified_company,
            defaults={
                "company_name": (
                    "Pending Verification Company"
                ),
                "website": (
                    "https://pending.example.com"
                ),
                "location": "Kyoto, Japan",
                "registration_number": (
                    "TEST-COMPANY-003"
                ),
                "contact_person": (
                    "Pending Recruiter"
                ),
                "verification_status": (
                    CompanyProfile
                    .VerificationStatus
                    .PENDING
                ),
                "verified_at": None,
            },
        )

        self.student_profile, _ = (
            StudentProfile.objects.update_or_create(
                user=self.student,
                defaults={
                    "headline": (
                        "Frontend developer"
                    ),
                    "skills": (
                        "React, JavaScript, HTML, "
                        "CSS, Git"
                    ),
                    "location": "Osaka, Japan",
                    "desired_job_title": (
                        "Frontend Developer"
                    ),
                    "preferred_workplace": (
                        "hybrid"
                    ),
                    "japanese_level": "n2",
                    "desired_salary_min": 250000,
                },
            )
        )

        self.strong_job = Job.objects.create(
            company=self.company,
            title_en="Frontend Developer",
            title_ja=(
                "フロントエンドエンジニア"
            ),
            description_en=(
                "Build responsive React "
                "applications."
            ),
            description_ja=(
                "Reactアプリケーションを"
                "開発します。"
            ),
            requirements=(
                "React, JavaScript, HTML, "
                "CSS, Git"
            ),
            location="Osaka, Japan",
            employment_type="full_time",
            workplace_type="hybrid",
            japanese_level="n2",
            salary_min=250000,
            salary_max=350000,
            status=Job.Status.PUBLISHED,
            is_active=True,
        )

        self.weak_job = Job.objects.create(
            company=self.company,
            title_en="Backend Developer",
            description_en=(
                "Develop backend services."
            ),
            requirements=(
                "Python, Django, PostgreSQL"
            ),
            location="Tokyo, Japan",
            employment_type="full_time",
            workplace_type="onsite",
            japanese_level="n1",
            salary_min=200000,
            salary_max=240000,
            status=Job.Status.PUBLISHED,
            is_active=True,
        )

        self.inactive_job = Job.objects.create(
            company=self.other_company,
            title_en="React Engineer",
            description_en=(
                "Develop React interfaces."
            ),
            requirements=(
                "React, JavaScript, HTML, CSS"
            ),
            location="Osaka, Japan",
            employment_type="full_time",
            workplace_type="hybrid",
            japanese_level="n2",
            salary_min=300000,
            salary_max=400000,
            status=Job.Status.CLOSED,
            is_active=False,
        )

    def authenticate_student(self):
        self.client.force_authenticate(
            user=self.student,
        )

    def authenticate_company(self):
        self.client.force_authenticate(
            user=self.company,
        )

    def get_job_payload(
        self,
        status_value=Job.Status.PUBLISHED,
    ):
        return {
            "title_en": "Frontend Engineer",
            "title_ja": (
                "フロントエンドエンジニア"
            ),
            "description_en": (
                "Build accessible React "
                "applications."
            ),
            "description_ja": (
                "Reactアプリケーションを"
                "開発します。"
            ),
            "requirements": (
                "React, JavaScript, HTML, CSS"
            ),
            "location": "Osaka, Japan",
            "employment_type": "full_time",
            "workplace_type": "hybrid",
            "japanese_level": "n2",
            "salary_min": 250000,
            "salary_max": 350000,
            "deadline": (
                timezone.localdate()
                + timedelta(days=30)
            ).isoformat(),
            "status": status_value,
        }

    def test_student_can_view_match_analysis(self):
        self.authenticate_student()

        url = reverse(
            "job-match-analysis",
            args=[self.strong_job.id],
        )

        response = self.client.get(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["job"]["id"],
            self.strong_job.id,
        )

        self.assertGreater(
            response.data["match_score"],
            50,
        )

        self.assertIn(
            "React",
            response.data["matching_skills"],
        )

    def test_company_cannot_view_match_analysis(
        self,
    ):
        self.authenticate_company()

        url = reverse(
            "job-match-analysis",
            args=[self.strong_job.id],
        )

        response = self.client.get(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_inactive_job_match_returns_not_found(
        self,
    ):
        self.authenticate_student()

        url = reverse(
            "job-match-analysis",
            args=[self.inactive_job.id],
        )

        response = self.client.get(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_recommended_jobs_are_ranked(self):
        self.authenticate_student()

        url = reverse(
            "job-recommended-jobs",
        )

        response = self.client.get(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            response.data["count"],
            2,
        )

        results = response.data["results"]

        self.assertEqual(
            results[0]["id"],
            self.strong_job.id,
        )

        self.assertGreaterEqual(
            results[0]["match_analysis"][
                "match_score"
            ],
            results[1]["match_analysis"][
                "match_score"
            ],
        )

    def test_inactive_job_is_not_recommended(self):
        self.authenticate_student()

        url = reverse(
            "job-recommended-jobs",
        )

        response = self.client.get(url)

        recommended_ids = [
            job["id"]
            for job in response.data["results"]
        ]

        self.assertNotIn(
            self.inactive_job.id,
            recommended_ids,
        )

    def test_student_can_save_and_remove_job(self):
        self.authenticate_student()

        url = reverse(
            "job-save-job",
            args=[self.strong_job.id],
        )

        save_response = self.client.post(url)

        self.assertEqual(
            save_response.status_code,
            status.HTTP_200_OK,
        )

        self.assertTrue(
            SavedJob.objects.filter(
                user=self.student,
                job=self.strong_job,
            ).exists(),
        )

        delete_response = self.client.delete(url)

        self.assertEqual(
            delete_response.status_code,
            status.HTTP_200_OK,
        )

        self.assertFalse(
            SavedJob.objects.filter(
                user=self.student,
                job=self.strong_job,
            ).exists(),
        )

    def test_saving_same_job_twice_is_safe(self):
        self.authenticate_student()

        url = reverse(
            "job-save-job",
            args=[self.strong_job.id],
        )

        first_response = self.client.post(url)
        second_response = self.client.post(url)

        self.assertEqual(
            first_response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            second_response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            SavedJob.objects.filter(
                user=self.student,
                job=self.strong_job,
            ).count(),
            1,
        )

    def test_company_cannot_save_job(self):
        self.authenticate_company()

        url = reverse(
            "job-save-job",
            args=[self.strong_job.id],
        )

        response = self.client.post(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        self.assertFalse(
            SavedJob.objects.filter(
                user=self.company,
                job=self.strong_job,
            ).exists(),
        )

    def test_student_can_view_saved_jobs(self):
        SavedJob.objects.create(
            user=self.student,
            job=self.strong_job,
        )

        self.authenticate_student()

        url = reverse(
            "job-saved-jobs",
        )

        response = self.client.get(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            len(response.data),
            1,
        )

        self.assertEqual(
            response.data[0]["id"],
            self.strong_job.id,
        )

    def test_company_cannot_view_saved_jobs(self):
        self.authenticate_company()

        url = reverse(
            "job-saved-jobs",
        )

        response = self.client.get(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_draft_job_is_hidden_from_students(self):
        draft_job = Job.objects.create(
            company=self.company,
            title_en="Draft Frontend Job",
            description_en="Draft description.",
            location="Osaka, Japan",
            status=Job.Status.DRAFT,
            is_active=False,
        )

        self.authenticate_student()

        list_response = self.client.get(
            reverse("job-list"),
        )

        self.assertEqual(
            list_response.status_code,
            status.HTTP_200_OK,
        )

        job_ids = [
            job["id"]
            for job in list_response.data
        ]

        self.assertNotIn(
            draft_job.id,
            job_ids,
        )

        detail_response = self.client.get(
            reverse(
                "job-detail",
                args=[draft_job.id],
            ),
        )

        self.assertEqual(
            detail_response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_closed_job_is_hidden_from_students(
        self,
    ):
        closed_job = Job.objects.create(
            company=self.company,
            title_en="Closed Frontend Job",
            description_en=(
                "Closed description."
            ),
            location="Osaka, Japan",
            status=Job.Status.CLOSED,
            is_active=False,
        )

        self.authenticate_student()

        response = self.client.get(
            reverse(
                "job-detail",
                args=[closed_job.id],
            ),
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_expired_job_is_hidden_from_students(
        self,
    ):
        expired_job = Job.objects.create(
            company=self.company,
            title_en="Expired Frontend Job",
            description_en=(
                "Expired description."
            ),
            location="Osaka, Japan",
            status=Job.Status.PUBLISHED,
            is_active=True,
            deadline=(
                timezone.localdate()
                - timedelta(days=1)
            ),
        )

        self.assertEqual(
            expired_job.effective_status,
            "expired",
        )

        self.assertFalse(
            expired_job.accepts_applications,
        )

        self.authenticate_student()

        list_response = self.client.get(
            reverse("job-list"),
        )

        self.assertEqual(
            list_response.status_code,
            status.HTTP_200_OK,
        )

        job_ids = [
            job["id"]
            for job in list_response.data
        ]

        self.assertNotIn(
            expired_job.id,
            job_ids,
        )

        detail_response = self.client.get(
            reverse(
                "job-detail",
                args=[expired_job.id],
            ),
        )

        self.assertEqual(
            detail_response.status_code,
            status.HTTP_404_NOT_FOUND,
        )

    def test_unverified_company_can_save_draft(
        self,
    ):
        self.client.force_authenticate(
            user=self.unverified_company,
        )

        response = self.client.post(
            reverse("job-list"),
            self.get_job_payload(
                Job.Status.DRAFT,
            ),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        created_job = Job.objects.get(
            id=response.data["id"],
        )

        self.assertEqual(
            created_job.status,
            Job.Status.DRAFT,
        )

        self.assertFalse(
            created_job.is_active,
        )

    def test_unverified_company_cannot_publish_job(
        self,
    ):
        self.client.force_authenticate(
            user=self.unverified_company,
        )

        response = self.client.post(
            reverse("job-list"),
            self.get_job_payload(
                Job.Status.PUBLISHED,
            ),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )

        self.assertFalse(
            Job.objects.filter(
                company=self.unverified_company,
                status=Job.Status.PUBLISHED,
            ).exists(),
        )

    def test_verified_company_can_publish_job(self):
        self.authenticate_company()

        response = self.client.post(
            reverse("job-list"),
            self.get_job_payload(
                Job.Status.PUBLISHED,
            ),
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        created_job = Job.objects.get(
            id=response.data["id"],
        )

        self.assertEqual(
            created_job.status,
            Job.Status.PUBLISHED,
        )

        self.assertTrue(
            created_job.is_active,
        )

        self.assertTrue(
            created_job.accepts_applications,
        )