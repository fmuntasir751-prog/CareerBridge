from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from profiles.models import StudentProfile

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
                    "preferred_workplace": "hybrid",
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
                "Reactアプリケーションを開発します。"
            ),
            requirements=(
                "React, JavaScript, HTML, CSS, Git"
            ),
            location="Osaka, Japan",
            employment_type="full_time",
            workplace_type="hybrid",
            japanese_level="n2",
            salary_min=250000,
            salary_max=350000,
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

    def test_company_cannot_view_match_analysis(self):
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

    def test_inactive_job_match_returns_not_found(self):
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
            ).exists()
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
            ).exists()
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
            ).exists()
        )

    def test_student_can_view_saved_jobs(self):
        SavedJob.objects.create(
            user=self.student,
            job=self.strong_job,
        )

        self.authenticate_student()

        url = reverse("job-saved-jobs")
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

        url = reverse("job-saved-jobs")
        response = self.client.get(url)

        self.assertEqual(
            response.status_code,
            status.HTTP_403_FORBIDDEN,
        )