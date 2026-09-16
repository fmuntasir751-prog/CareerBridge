from django.db.models import Count, Q
from rest_framework import generics
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import (
    FormParser,
    JSONParser,
    MultiPartParser,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from applications.models import Application
from jobs.models import SavedJob

from .models import CompanyProfile, StudentProfile
from .serializers import (
    CompanyProfileSerializer,
    StudentProfileSerializer,
)


class StudentProfileView(
    generics.RetrieveUpdateAPIView,
):
    serializer_class = StudentProfileSerializer
    permission_classes = [IsAuthenticated]

    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]

    def get_object(self):
        user = self.request.user

        if user.role != "student":
            raise PermissionDenied(
                "Only student accounts can access this profile."
            )

        profile, _ = StudentProfile.objects.get_or_create(
            user=user,
        )

        return profile


class StudentProgressView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.role != "student":
            raise PermissionDenied(
                "Only student accounts can view career progress."
            )

        profile, _ = StudentProfile.objects.get_or_create(
            user=user,
        )

        profile_fields = {
            "headline": profile.headline,
            "bio": profile.bio,
            "skills": profile.skills,
            "university": profile.university,
            "graduation_year": profile.graduation_year,
            "location": profile.location,
            "profile_image": profile.profile_image,
            "resume": profile.resume,
        }

        completed_fields = [
            field_name
            for field_name, value in profile_fields.items()
            if value
        ]

        missing_fields = [
            field_name
            for field_name, value in profile_fields.items()
            if not value
        ]

        total_fields = len(profile_fields)

        profile_completion = round(
            len(completed_fields) / total_fields * 100
        )

        application_summary = (
            Application.objects.filter(
                applicant=user,
            ).aggregate(
                total=Count("id"),
                pending=Count(
                    "id",
                    filter=Q(status="pending"),
                ),
                reviewing=Count(
                    "id",
                    filter=Q(status="reviewing"),
                ),
                interview=Count(
                    "id",
                    filter=Q(status="interview"),
                ),
                accepted=Count(
                    "id",
                    filter=Q(status="accepted"),
                ),
                rejected=Count(
                    "id",
                    filter=Q(status="rejected"),
                ),
                withdrawn=Count(
                    "id",
                    filter=Q(status="withdrawn"),
                ),
            )
        )

        saved_jobs = SavedJob.objects.filter(
            user=user,
        ).count()

        if profile_completion < 100:
            next_action = "complete_profile"
        elif application_summary["total"] == 0:
            next_action = "apply_for_jobs"
        elif application_summary["interview"] > 0:
            next_action = "prepare_for_interview"
        else:
            next_action = "continue_job_search"

        return Response(
            {
                "profile_completion": profile_completion,
                "completed_fields": len(completed_fields),
                "total_fields": total_fields,
                "missing_fields": missing_fields,
                "applications": application_summary,
                "saved_jobs": saved_jobs,
                "next_action": next_action,
            }
        )


class CompanyProfileView(
    generics.RetrieveUpdateAPIView,
):
    serializer_class = CompanyProfileSerializer
    permission_classes = [IsAuthenticated]

    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]

    def get_object(self):
        user = self.request.user

        if user.role != "company":
            raise PermissionDenied(
                "Only company accounts can access this profile."
            )

        profile, _ = CompanyProfile.objects.get_or_create(
            user=user,
            defaults={
                "company_name": user.username,
            },
        )

        return profile