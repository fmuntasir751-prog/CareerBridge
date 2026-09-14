from rest_framework import serializers

from .models import Application


class ApplicationSerializer(serializers.ModelSerializer):
    applicant_name = serializers.CharField(
        source="applicant.username",
        read_only=True,
    )
    job_title = serializers.CharField(
        source="job.title_en",
        read_only=True,
    )
    job_title_ja = serializers.CharField(
    source="job.title_ja",
    read_only=True,
)

    applicant_email = serializers.EmailField(
    source="applicant.email",
    read_only=True,
)
    company_name = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = (
            "id",
            "job",
            "job_title",
            "company_name",
            "applicant",
            "applicant_name",
            "cover_letter",
            "resume",
            "status",
            "applied_at",
            "updated_at",
            "job_title_ja",
"applicant_email",
        )
        read_only_fields = (
            "id",
            "applicant",
            "applicant_name",
            "status",
            "applied_at",
            "updated_at",
        )

    def get_company_name(self, obj):
        profile = getattr(obj.job.company, "company_profile", None)

        if profile:
            return profile.company_name

        return obj.job.company.username

    def validate_job(self, job):
        if not job.is_active:
            raise serializers.ValidationError(
                "Applications for this job are closed."
            )
        return job


class ApplicationStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = ("id", "status")
        read_only_fields = ("id",)