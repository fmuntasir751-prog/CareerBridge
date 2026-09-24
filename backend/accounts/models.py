from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        STUDENT = "student", "Student"
        COMPANY = "company", "Company"
        ADMIN = "admin", "Admin"

    class Language(models.TextChoices):
        ENGLISH = "en", "English"
        JAPANESE = "ja", "Japanese"

    email = models.EmailField(unique=True)

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.STUDENT,
    )

    preferred_language = models.CharField(
        max_length=2,
        choices=Language.choices,
        default=Language.ENGLISH,
    )

    email_verified = models.BooleanField(default=False)

    email_otp = models.CharField(
        max_length=128,
        blank=True,
    )

    email_otp_created_at = models.DateTimeField(
        blank=True,
        null=True,
    )

    email_otp_attempts = models.PositiveSmallIntegerField(
        default=0,
    )

    def __str__(self):
        return self.email