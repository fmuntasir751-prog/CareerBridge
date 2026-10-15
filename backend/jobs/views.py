from django.db.models import Count, Q
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import (
    NotFound,
    PermissionDenied,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from profiles.models import (
    CompanyProfile,
    StudentProfile,
)

from .matching import calculate_job_match
from .models import Job, SavedJob
from .permissions import IsCompanyOwnerOrReadOnly
from .serializers import JobSerializer


class JobViewSet(viewsets.ModelViewSet):
    serializer_class = JobSerializer

    permission_classes = [
        IsCompanyOwnerOrReadOnly,
    ]

    filter_backends = [
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    search_fields = [
        "title_en",
        "title_ja",
        "description_en",
        "description_ja",
        "requirements",
        "location",
        "company__company_profile__company_name",
    ]

    ordering_fields = [
        "created_at",
        "deadline",
        "salary_min",
        "salary_max",
    ]

    def get_verified_company_filter(self):
        return Q(
            company__company_profile__verification_status=(
    CompanyProfile
    .VerificationStatus
    .VERIFIED
)
        )

    def get_queryset(self):
        queryset = Job.objects.select_related(
            "company",
            "company__company_profile",
        )

        verified_company_filter = Q(
            company__company_profile__verification_status=(
                CompanyProfile
                .VerificationStatus
                .VERIFIED
            )
        )

        if self.action == "list":
            return queryset.filter(
                verified_company_filter,
                is_active=True,
            )

        if self.action == "retrieve":
            user = self.request.user

            if user.is_authenticated:
                return queryset.filter(
                    Q(company=user)
                    | (
                        verified_company_filter
                        & Q(is_active=True)
                    )
                )

            return queryset.filter(
                verified_company_filter,
                is_active=True,
            )

        if self.action in (
            "match_analysis",
            "save_job",
        ):
            return queryset.filter(
                verified_company_filter,
                is_active=True,
            )

        return queryset

    def get_verified_company_profile(self):
        user = self.request.user

        if user.role != "company":
            raise PermissionDenied(
                "Only company accounts can "
                "manage jobs."
            )

        profile = getattr(
            user,
            "company_profile",
            None,
        )

        if profile is None:
            raise PermissionDenied(
                "Please complete your company "
                "profile before posting a job."
            )

        if not profile.is_verified:
            raise PermissionDenied(
                "Your company must be verified "
                "before publishing jobs."
            )

        return profile

    def perform_create(self, serializer):
        self.get_verified_company_profile()

        serializer.save(
            company=self.request.user,
        )

    def perform_update(self, serializer):
        job_will_be_active = (
            serializer.validated_data.get(
                "is_active",
                serializer.instance.is_active,
            )
        )

        if job_will_be_active:
            self.get_verified_company_profile()

        serializer.save()

    @action(
        detail=False,
        methods=["get"],
        url_path="recommended",
        permission_classes=[IsAuthenticated],
    )
    def recommended_jobs(self, request):
        if request.user.role != "student":
            raise PermissionDenied(
                "Only student accounts can view "
                "recommended jobs."
            )

        profile, _ = (
            StudentProfile.objects.get_or_create(
                user=request.user,
            )
        )

        active_jobs = (
            Job.objects.filter(
                is_active=True,
               company__company_profile__verification_status=(
    CompanyProfile
    .VerificationStatus
    .VERIFIED
)
            )
            .select_related(
                "company",
                "company__company_profile",
            )
            .order_by("-created_at")
        )

        ranked_jobs = []

        for job in active_jobs:
            analysis = calculate_job_match(
                profile,
                job,
            )

            ranked_jobs.append(
                {
                    "job": job,
                    "analysis": analysis,
                }
            )

        ranked_jobs.sort(
            key=lambda item: (
                item["analysis"]["match_score"],
                item["job"].created_at,
            ),
            reverse=True,
        )

        results = []

        for item in ranked_jobs[:3]:
            job = item["job"]

            job_data = self.get_serializer(
                job,
            ).data

            results.append(
                {
                    **job_data,
                    "match_analysis": (
                        item["analysis"]
                    ),
                }
            )

        return Response(
            {
                "count": len(results),
                "results": results,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["get"],
        url_path="match-analysis",
        permission_classes=[IsAuthenticated],
    )
    def match_analysis(self, request, pk=None):
        if request.user.role != "student":
            raise PermissionDenied(
                "Only student accounts can view "
                "job matches."
            )

        job = self.get_object()

        if not job.is_active:
            raise NotFound(
                "This job is no longer active."
            )

        profile, _ = (
            StudentProfile.objects.get_or_create(
                user=request.user,
            )
        )

        analysis = calculate_job_match(
            profile,
            job,
        )

        company_profile = getattr(
            job.company,
            "company_profile",
            None,
        )

        company_name = (
            company_profile.company_name
            if company_profile
            else job.company.username
        )

        return Response(
            {
                "job": {
                    "id": job.id,
                    "title_en": job.title_en,
                    "title_ja": job.title_ja,
                    "company_name": company_name,
                    "company_verified": bool(
                        company_profile
                        and company_profile.is_verified
                    ),
                },
                **analysis,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["post", "delete"],
        url_path="save",
        permission_classes=[IsAuthenticated],
    )
    def save_job(self, request, pk=None):
        if request.user.role != "student":
            raise PermissionDenied(
                "Only student accounts can save jobs."
            )

        job = self.get_object()

        if request.method == "POST":
            _, created = (
                SavedJob.objects.get_or_create(
                    user=request.user,
                    job=job,
                )
            )

            message = (
                "Job was saved successfully."
                if created
                else "Job is already saved."
            )

            return Response(
                {
                    "detail": message,
                    "saved": True,
                    "job_id": job.id,
                },
                status=status.HTTP_200_OK,
            )

        deleted_count, _ = (
            SavedJob.objects.filter(
                user=request.user,
                job=job,
            ).delete()
        )

        message = (
            "Job was removed from saved jobs."
            if deleted_count
            else "Job was not saved."
        )

        return Response(
            {
                "detail": message,
                "saved": False,
                "job_id": job.id,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="saved",
        permission_classes=[IsAuthenticated],
    )
    def saved_jobs(self, request):
        if request.user.role != "student":
            raise PermissionDenied(
                "Only student accounts can view "
                "saved jobs."
            )

        jobs = (
            Job.objects.filter(
                saved_by_users__user=request.user,
                is_active=True,
                company__company_profile__verification_status=(
    CompanyProfile
    .VerificationStatus
    .VERIFIED
)
            )
            .select_related(
                "company",
                "company__company_profile",
            )
            .order_by(
                "-saved_by_users__created_at",
            )
        )

        serializer = self.get_serializer(
            jobs,
            many=True,
        )

        return Response(serializer.data)

    @action(
        detail=False,
        methods=["get"],
        url_path="mine",
        permission_classes=[IsAuthenticated],
    )
    def my_jobs(self, request):
        if request.user.role != "company":
            raise PermissionDenied(
                "Only company accounts can "
                "manage jobs."
            )

        jobs = (
            Job.objects.filter(
                company=request.user,
            )
            .select_related(
                "company",
                "company__company_profile",
            )
            .order_by("-created_at")
        )

        serializer = self.get_serializer(
            jobs,
            many=True,
        )

        return Response(serializer.data)

    @action(
        detail=False,
        methods=["get"],
        url_path="analytics",
        permission_classes=[IsAuthenticated],
    )
    def analytics(self, request):
        if request.user.role != "company":
            raise PermissionDenied(
                "Only company accounts can view "
                "analytics."
            )

        company_jobs = Job.objects.filter(
            company=request.user,
        )

        summary = company_jobs.aggregate(
            total_jobs=Count("id"),
            active_jobs=Count(
                "id",
                filter=Q(is_active=True),
            ),
            inactive_jobs=Count(
                "id",
                filter=Q(is_active=False),
            ),
            total_applications=Count(
                "applications",
            ),
            pending_applications=Count(
                "applications",
                filter=Q(
                    applications__status="pending",
                ),
            ),
            reviewing_applications=Count(
                "applications",
                filter=Q(
                    applications__status="reviewing",
                ),
            ),
            interview_applications=Count(
                "applications",
                filter=Q(
                    applications__status="interview",
                ),
            ),
            accepted_applications=Count(
                "applications",
                filter=Q(
                    applications__status="accepted",
                ),
            ),
            rejected_applications=Count(
                "applications",
                filter=Q(
                    applications__status="rejected",
                ),
            ),
            withdrawn_applications=Count(
                "applications",
                filter=Q(
                    applications__status="withdrawn",
                ),
            ),
        )

        jobs = (
            company_jobs.annotate(
                application_count=Count(
                    "applications",
                )
            )
            .values(
                "id",
                "title_en",
                "title_ja",
                "is_active",
                "application_count",
                "created_at",
            )
            .order_by(
                "-application_count",
                "-created_at",
            )
        )

        return Response(
            {
                "summary": summary,
                "jobs": list(jobs),
            },
            status=status.HTTP_200_OK,
        )