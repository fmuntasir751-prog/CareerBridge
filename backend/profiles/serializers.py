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

    profile_completion = serializers.SerializerMethodField()
    matching_ready = serializers.SerializerMethodField()
    missing_matching_fields = serializers.SerializerMethodField()

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
            "profile_completion",
            "matching_ready",
            "missing_matching_fields",
        )

        read_only_fields = (
            "id",
            "username",
            "email",
            "profile_completion",
            "matching_ready",
            "missing_matching_fields",
        )

    def get_completion_checks(self, obj):
        return {
            "headline": bool(obj.headline.strip()),
            "bio": bool(obj.bio.strip()),
            "skills": bool(obj.skills.strip()),
            "university": bool(obj.university.strip()),
            "graduation_year": (
                obj.graduation_year is not None
            ),
            "location": bool(obj.location.strip()),
            "desired_job_title": bool(
                obj.desired_job_title.strip()
            ),
            "preferred_workplace": (
                obj.preferred_workplace
                != StudentProfile.WorkplacePreference.ANY
            ),
            "japanese_level": (
                obj.japanese_level
                != StudentProfile.JapaneseLevel.NOT_REQUIRED
            ),
            "desired_salary_min": (
                obj.desired_salary_min is not None
            ),
            "resume": bool(obj.resume),
        }

    def get_profile_completion(self, obj):
        checks = self.get_completion_checks(obj)

        completed = sum(checks.values())
        total = len(checks)

        return round(
            completed / total * 100
        )

    def get_missing_matching_fields(self, obj):
        required_fields = {
            "skills": bool(obj.skills.strip()),
            "location": bool(obj.location.strip()),
            "desired_job_title": bool(
                obj.desired_job_title.strip()
            ),
            "preferred_workplace": (
                obj.preferred_workplace
                != StudentProfile.WorkplacePreference.ANY
            ),
            "japanese_level": (
                obj.japanese_level
                != StudentProfile.JapaneseLevel.NOT_REQUIRED
            ),
            "desired_salary_min": (
                obj.desired_salary_min is not None
            ),
        }

        return [
            field_name
            for field_name, completed
            in required_fields.items()
            if not completed
        ]

    def get_matching_ready(self, obj):
        return not self.get_missing_matching_fields(obj)


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