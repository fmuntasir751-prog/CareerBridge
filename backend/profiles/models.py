from django.conf import settings
from django.db import models


class StudentProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="student_profile",
    )
    headline = models.CharField(max_length=200, blank=True)
    bio = models.TextField(blank=True)
    skills = models.TextField(
        blank=True,
        help_text="Separate skills using commas",
    )
    university = models.CharField(max_length=200, blank=True)
    graduation_year = models.PositiveIntegerField(null=True, blank=True)
    location = models.CharField(max_length=150, blank=True)
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
        return f"{self.user.username} - Student Profile"


class CompanyProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="company_profile",
    )
    company_name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    website = models.URLField(blank=True)
    location = models.CharField(max_length=150, blank=True)
    logo = models.ImageField(
        upload_to="company_logos/",
        blank=True,
        null=True,
    )

    def __str__(self):
        return self.company_name