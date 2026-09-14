from rest_framework import serializers

from .models import CompanyProfile, StudentProfile


class StudentProfileSerializer(serializers.ModelSerializer):
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
            "profile_image",
            "resume",
        )


class CompanyProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        source="user.username",
        read_only=True,
    )
    email = serializers.EmailField(
        source="user.email",
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
            "logo",
        )
        