from rest_framework import serializers

from .models import Job


class JobSerializer(serializers.ModelSerializer):
    company_name = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = (
            "id",
            "company",
            "company_name",
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
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "company",
            "company_name",
            "created_at",
            "updated_at",
        )

    def get_company_name(self, obj):
        profile = getattr(obj.company, "company_profile", None)

        if profile:
            return profile.company_name

        return obj.company.username

    def validate(self, attrs):
        salary_min = attrs.get(
            "salary_min",
            getattr(self.instance, "salary_min", None),
        )
        salary_max = attrs.get(
            "salary_max",
            getattr(self.instance, "salary_max", None),
        )

        if (
            salary_min is not None
            and salary_max is not None
            and salary_min > salary_max
        ):
            raise serializers.ValidationError(
                {
                    "salary_max": (
                        "Maximum salary must be greater than "
                        "minimum salary."
                    )
                }
            )

        return attrs