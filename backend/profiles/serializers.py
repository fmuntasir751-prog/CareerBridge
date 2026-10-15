from rest_framework import serializers

from .models import (
    CompanyProfile,
    ResumeAnalysis,
    StudentProfile,
)


class StudentProfileSerializer(
    serializers.ModelSerializer,
):
    username = serializers.CharField(
        source="user.username",
        read_only=True,
    )

    email = serializers.EmailField(
        source="user.email",
        read_only=True,
    )

    class Meta:
        model = StudentProfile

        fields = (
            "id",
            "username",
            "email",
            "headline",
            "bio",
            "skills",
            "university",
            "graduation_year",
            "location",
            "desired_job_title",
            "preferred_workplace",
            "japanese_level",
            "desired_salary_min",
            "profile_image",
            "resume",
        )

        read_only_fields = (
            "id",
            "username",
            "email",
        )


class CompanyProfileSerializer(
    serializers.ModelSerializer,
):
    username = serializers.CharField(
        source="user.username",
        read_only=True,
    )

    email = serializers.EmailField(
        source="user.email",
        read_only=True,
    )

    is_verified = serializers.BooleanField(
        read_only=True,
    )

    class Meta:
        model = CompanyProfile

        fields = (
            "id",
            "username",
            "email",
            "company_name",
            "description",
            "website",
            "location",
            "registration_number",
            "contact_person",
            "verification_status",
            "verification_note",
            "verified_at",
            "is_verified",
            "logo",
            "created_at",
            "updated_at",
        )

        read_only_fields = (
            "id",
            "username",
            "email",
            "verification_status",
            "verification_note",
            "verified_at",
            "is_verified",
            "created_at",
            "updated_at",
        )

    def validate_registration_number(self, value):
        return value.strip()

    def validate_contact_person(self, value):
        return value.strip()


class ResumeAnalysisSerializer(
    serializers.ModelSerializer,
):
    class Meta:
        model = ResumeAnalysis

        fields = (
            "id",
            "resume_name",
            "language",
            "status",
            "overall_score",
            "analysis",
            "error_message",
            "created_at",
            "updated_at",
        )

        read_only_fields = fields