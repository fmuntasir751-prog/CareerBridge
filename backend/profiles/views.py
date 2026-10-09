from django.db.models import Count, Q
from rest_framework import generics,status
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

from .models import (
    CompanyProfile,
    ResumeAnalysis,
    StudentProfile,
)
from .serializers import (
    CompanyProfileSerializer,
    ResumeAnalysisSerializer,
    StudentProfileSerializer,
)
from .resume_analysis import (
    ResumeAnalysisError,
    calculate_resume_hash,
    extract_resume_text,
    generate_ai_analysis,
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
class StudentResumeAnalysisView(APIView):
    permission_classes = [IsAuthenticated]

    def get_profile(self, request):
        if request.user.role != "student":
            raise PermissionDenied(
                "Only student accounts can "
                "analyze resumes."
            )

        profile, _ = (
            StudentProfile.objects.get_or_create(
                user=request.user,
            )
        )

        return profile

    def get(self, request):
        profile = self.get_profile(request)

        analyses = (
            ResumeAnalysis.objects.filter(
                student_profile=profile,
            )[:10]
        )

        serializer = ResumeAnalysisSerializer(
            analyses,
            many=True,
        )

        return Response(
            {
                "count": len(serializer.data),
                "results": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        profile = self.get_profile(request)

        if not profile.resume:
            return Response(
                {
                    "detail": (
                        "Upload and save a resume "
                        "before requesting analysis."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        language = request.data.get(
            "language",
            "en",
        )

        if language not in ("en", "ja"):
            language = "en"

        force_analysis = (
            str(
                request.data.get(
                    "force",
                    "",
                )
            ).lower()
            in (
                "1",
                "true",
                "yes",
            )
        )

        try:
            resume_hash = (
                calculate_resume_hash(
                    profile.resume,
                )
            )
        except (OSError, ValueError):
            return Response(
                {
                    "detail": (
                        "The saved resume file "
                        "could not be opened."
                    ),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not force_analysis:
            existing_analysis = (
                ResumeAnalysis.objects.filter(
                    student_profile=profile,
                    resume_hash=resume_hash,
                    language=language,
                    status=(
                        ResumeAnalysis.Status.COMPLETED
                    ),
                ).first()
            )

            if existing_analysis:
                response_data = (
                    ResumeAnalysisSerializer(
                        existing_analysis,
                    ).data
                )

                return Response(
                    {
                        **response_data,
                        "cached": True,
                    },
                    status=status.HTTP_200_OK,
                )

        analysis_record = (
            ResumeAnalysis.objects.create(
                student_profile=profile,
                resume_name=profile.resume.name,
                resume_hash=resume_hash,
                language=language,
                status=(
                    ResumeAnalysis.Status.PROCESSING
                ),
            )
        )

        try:
            resume_text = extract_resume_text(
                profile.resume,
            )

            result = generate_ai_analysis(
                resume_text,
                language,
                profile,
            )

            analysis_record.overall_score = (
                result["overall_score"]
            )

            analysis_record.analysis = result
            analysis_record.status = (
                ResumeAnalysis.Status.COMPLETED
            )

            analysis_record.error_message = ""

            analysis_record.save(
                update_fields=[
                    "overall_score",
                    "analysis",
                    "status",
                    "error_message",
                    "updated_at",
                ],
            )

        except ResumeAnalysisError as error:
            analysis_record.status = (
                ResumeAnalysis.Status.FAILED
            )

            analysis_record.error_message = str(
                error,
            )[:500]

            analysis_record.save(
                update_fields=[
                    "status",
                    "error_message",
                    "updated_at",
                ],
            )

            return Response(
                {
                    "detail": str(error),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception as error:
            print(
                f"Resume analysis endpoint failed: "
                f"{error}",
                flush=True,
            )

            analysis_record.status = (
                ResumeAnalysis.Status.FAILED
            )

            analysis_record.error_message = (
                "Resume analysis failed."
            )

            analysis_record.save(
                update_fields=[
                    "status",
                    "error_message",
                    "updated_at",
                ],
            )

            return Response(
                {
                    "detail": (
                        "Resume analysis could "
                        "not be completed."
                    ),
                },
                status=(
                    status.HTTP_500_INTERNAL_SERVER_ERROR
                ),
            )

        response_data = ResumeAnalysisSerializer(
            analysis_record,
        ).data

        return Response(
            {
                **response_data,
                "cached": False,
            },
            status=status.HTTP_201_CREATED,
        )