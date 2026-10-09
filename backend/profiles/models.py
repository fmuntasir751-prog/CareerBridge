from django.conf import settings
from django.db import models


class StudentProfile(models.Model):
    class JapaneseLevel(models.TextChoices):
        NOT_REQUIRED = (
            "not_required",
            "Not specified",
        )
        N3 = "n3", "JLPT N3"
        N2 = "n2", "JLPT N2"
        N1 = "n1", "JLPT N1"

    class WorkplacePreference(models.TextChoices):
        ANY = "any", "Any"
        ONSITE = "onsite", "On-site"
        REMOTE = "remote", "Remote"
        HYBRID = "hybrid", "Hybrid"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="student_profile",
    )

    headline = models.CharField(
        max_length=200,
        blank=True,
    )

    bio = models.TextField(
        blank=True,
    )

    skills = models.TextField(
        blank=True,
        help_text="Separate skills using commas",
    )

    university = models.CharField(
        max_length=200,
        blank=True,
    )

    graduation_year = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    location = models.CharField(
        max_length=150,
        blank=True,
    )

    desired_job_title = models.CharField(
        max_length=200,
        blank=True,
    )

    preferred_workplace = models.CharField(
        max_length=20,
        choices=WorkplacePreference.choices,
        default=WorkplacePreference.ANY,
    )

    japanese_level = models.CharField(
        max_length=20,
        choices=JapaneseLevel.choices,
        default=JapaneseLevel.NOT_REQUIRED,
    )

    desired_salary_min = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    profile_image = models.ImageField(
        upload_to="student_profiles/",
        blank=True,
        null=True,
    )

    resume = models.FileField(
        upload_to="resumes/",
        blank=True,
        null=True,
    )

    def __str__(self):
        return (
            f"{self.user.username}"
            " - Student Profile"
        )


class CompanyProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="company_profile",
    )

    company_name = models.CharField(
        max_length=200,
    )

    description = models.TextField(
        blank=True,
    )

    website = models.URLField(
        blank=True,
    )

    location = models.CharField(
        max_length=150,
        blank=True,
    )

    logo = models.ImageField(
        upload_to="company_logos/",
        blank=True,
        null=True,
    )

    def __str__(self):
        return self.company_name


class ResumeAnalysis(models.Model):
    class Status(models.TextChoices):
        PROCESSING = (
            "processing",
            "Processing",
        )
        COMPLETED = (
            "completed",
            "Completed",
        )
        FAILED = (
            "failed",
            "Failed",
        )

    student_profile = models.ForeignKey(
        StudentProfile,
        on_delete=models.CASCADE,
        related_name="resume_analyses",
    )

    resume_name = models.CharField(
        max_length=255,
    )

    resume_hash = models.CharField(
        max_length=64,
        db_index=True,
    )

    language = models.CharField(
        max_length=5,
        choices=(
            ("en", "English"),
            ("ja", "Japanese"),
        ),
        default="en",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PROCESSING,
    )

    overall_score = (
        models.PositiveSmallIntegerField(
            default=0,
        )
    )

    analysis = models.JSONField(
        default=dict,
        blank=True,
    )

    error_message = models.CharField(
        max_length=500,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-created_at"]

        indexes = [
            models.Index(
                fields=[
                    "student_profile",
                    "resume_hash",
                ],
                name="resume_profile_hash_idx",
            ),
        ]

    def __str__(self):
        return (
            f"{self.student_profile.user.username}"
            f" - {self.overall_score}%"
        )