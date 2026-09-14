from django.conf import settings
from django.db import models


class Job(models.Model):
    class EmploymentType(models.TextChoices):
        FULL_TIME = "full_time", "Full-time"
        PART_TIME = "part_time", "Part-time"
        INTERNSHIP = "internship", "Internship"
        CONTRACT = "contract", "Contract"

    class WorkplaceType(models.TextChoices):
        ONSITE = "onsite", "On-site"
        REMOTE = "remote", "Remote"
        HYBRID = "hybrid", "Hybrid"

    class JapaneseLevel(models.TextChoices):
        NOT_REQUIRED = "not_required", "Not required"
        N3 = "n3", "JLPT N3"
        N2 = "n2", "JLPT N2"
        N1 = "n1", "JLPT N1"

    company = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="jobs",
        limit_choices_to={"role": "company"},
    )

    title_en = models.CharField(max_length=200)
    title_ja = models.CharField(max_length=200, blank=True)

    description_en = models.TextField()
    description_ja = models.TextField(blank=True)

    requirements = models.TextField(blank=True)
    location = models.CharField(max_length=150)

    employment_type = models.CharField(
        max_length=20,
        choices=EmploymentType.choices,
        default=EmploymentType.FULL_TIME,
    )

    workplace_type = models.CharField(
        max_length=20,
        choices=WorkplaceType.choices,
        default=WorkplaceType.ONSITE,
    )

    japanese_level = models.CharField(
        max_length=20,
        choices=JapaneseLevel.choices,
        default=JapaneseLevel.NOT_REQUIRED,
    )

    salary_min = models.PositiveIntegerField(
        null=True,
        blank=True,
    )
    salary_max = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    deadline = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title_en