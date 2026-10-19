from django.utils import timezone
from rest_framework import serializers

from .models import Job


class JobSerializer(serializers.ModelSerializer):
    company_name = (
        serializers.SerializerMethodField()
    )

    company_verified = (
        serializers.SerializerMethodField()
    )

    effective_status = serializers.CharField(
        read_only=True,
    )

    accepts_applications = serializers.BooleanField(
        read_only=True,
    )

    class Meta:
        model = Job

        fields = (
            "id",
            "company",
            "company_name",
            "company_verified",
            "title_en",
            "title_ja",
            "description_en",
            "description_ja",
            "requirements",
            "location",
            "employment_type",
            "workplace_type",
            "japanese_level",
            "salary_min",
            "salary_max",
            "deadline",
            "status",
            "effective_status",
            "accepts_applications",
            "is_active",
            "created_at",
            "updated_at",
        )

        read_only_fields = (
            "id",
            "company",
            "company_name",
            "company_verified",
            "effective_status",
            "accepts_applications",
            "created_at",
            "updated_at",
        )

    def get_company_profile(self, obj):
        return getattr(
            obj.company,
            "company_profile",
            None,
        )

    def get_company_name(self, obj):
        profile = self.get_company_profile(obj)

        if profile:
            return profile.company_name

        return obj.company.username

    def get_company_verified(self, obj):
        profile = self.get_company_profile(obj)

        return bool(
            profile
            and profile.is_verified
        )

    def validate(self, attrs):
        salary_min = attrs.get(
            "salary_min",
            getattr(
                self.instance,
                "salary_min",
                None,
            ),
        )

        salary_max = attrs.get(
            "salary_max",
            getattr(
                self.instance,
                "salary_max",
                None,
            ),
        )

        if (
            salary_min is not None
            and salary_max is not None
            and salary_min > salary_max
        ):
            raise serializers.ValidationError(
                {
                    "salary_max": (
                        "Maximum salary must be "
                        "greater than minimum salary."
                    ),
                },
            )

        deadline = attrs.get(
            "deadline",
            getattr(
                self.instance,
                "deadline",
                None,
            ),
        )

        if (
            deadline is not None
            and deadline.year < 2000
        ):
            raise serializers.ValidationError(
                {
                    "deadline": (
                        "Enter a valid application "
                        "deadline."
                    ),
                },
            )

        current_status = getattr(
            self.instance,
            "status",
            Job.Status.PUBLISHED,
        )

        job_status = attrs.get(
            "status",
            current_status,
        )

        # Support the existing is_active toggle.
        if (
            "is_active" in attrs
            and "status" not in attrs
        ):
            job_status = (
                Job.Status.PUBLISHED
                if attrs["is_active"]
                else Job.Status.CLOSED
            )

            attrs["status"] = job_status

        # Keep status and is_active synchronized.
        if "status" in attrs:
            attrs["is_active"] = (
                job_status == Job.Status.PUBLISHED
            )

        if (
            job_status == Job.Status.PUBLISHED
            and deadline is not None
            and deadline < timezone.localdate()
        ):
            raise serializers.ValidationError(
                {
                    "deadline": (
                        "A published job cannot have "
                        "a deadline in the past."
                    ),
                },
            )

        return attrs