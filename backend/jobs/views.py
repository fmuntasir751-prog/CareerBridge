from django.db.models import Count, Q
from django.utils import timezone
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
            ),
        )

    def get_public_job_filter(self):
        today = timezone.localdate()

        return (
            self.get_verified_company_filter()
            & Q(
                status=Job.Status.PUBLISHED,
                is_active=True,
            )
            & (
                Q(deadline__isnull=True)
                | Q(deadline__gte=today)
            )
        )

    def get_queryset(self):
        queryset = Job.objects.select_related(
            "company",
            "company__company_profile",
        )

        public_job_filter = (
            self.get_public_job_filter()
        )

        if self.action == "list":
            return queryset.filter(
                public_job_filter,
            )

        if self.action == "retrieve":
            user = self.request.user

            if user.is_authenticated:
                return queryset.filter(
                    Q(company=user)
                    | public_job_filter
                )

            return queryset.filter(
                public_job_filter,
            )

        if self.action in (
            "match_analysis",
            "save_job",
        ):
            return queryset.filter(
                public_job_filter,
            )

        return queryset

    def get_company_profile(
        self,
        require_verified=False,
    ):
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
                "profile before managing jobs."
            )

        if (
            require_verified
            and not profile.is_verified
        ):
            raise PermissionDenied(
                "Your company must be verified "
                "before publishing jobs."
            )

        return profile

    def perform_create(self, serializer):
        requested_status = (
            serializer.validated_data.get(
                "status",
                Job.Status.PUBLISHED,
            )
        )

        self.get_company_profile(
            require_verified=(
                requested_status
                == Job.Status.PUBLISHED
            ),
        )

        serializer.save(
            company=self.request.user,
        )

    def perform_update(self, serializer):
        requested_status = (
            serializer.validated_data.get(
                "status",
                serializer.instance.status,
            )
        )

        self.get_company_profile(
            require_verified=(
                requested_status
                == Job.Status.PUBLISHED
            ),
        )

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
                self.get_public_job_filter(),
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

        if not job.accepts_applications:
            raise NotFound(
                "This job is not accepting "
                "applications."
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
                    "effective_status": (
                        job.effective_status
                    ),
                    "accepts_applications": (
                        job.accepts_applications
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

        if not job.is_publicly_visible:
            raise NotFound(
                "This job is no longer available."
            )

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
                self.get_public_job_filter(),
                saved_by_users__user=request.user,
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

        today = timezone.localdate()

        company_jobs = Job.objects.filter(
            company=request.user,
        )

        summary = company_jobs.aggregate(
            total_jobs=Count(
                "id",
                distinct=True,
            ),
            draft_jobs=Count(
                "id",
                filter=Q(
                    status=Job.Status.DRAFT,
                ),
                distinct=True,
            ),
            published_jobs=Count(
                "id",
                filter=(
                    Q(
                        status=Job.Status.PUBLISHED,
                        is_active=True,
                    )
                    & (
                        Q(deadline__isnull=True)
                        | Q(deadline__gte=today)
                    )
                ),
                distinct=True,
            ),
            closed_jobs=Count(
                "id",
                filter=Q(
                    status=Job.Status.CLOSED,
                ),
                distinct=True,
            ),
            expired_jobs=Count(
                "id",
                filter=Q(
                    status=Job.Status.PUBLISHED,
                    deadline__lt=today,
                ),
                distinct=True,
            ),
            active_jobs=Count(
                "id",
                filter=Q(
                    is_active=True,
                ),
                distinct=True,
            ),
            inactive_jobs=Count(
                "id",
                filter=Q(
                    is_active=False,
                ),
                distinct=True,
            ),
            total_applications=Count(
                "applications",
                distinct=True,
            ),
            pending_applications=Count(
                "applications",
                filter=Q(
                    applications__status="pending",
                ),
                distinct=True,
            ),
            reviewing_applications=Count(
                "applications",
                filter=Q(
                    applications__status="reviewing",
                ),
                distinct=True,
            ),
            interview_applications=Count(
                "applications",
                filter=Q(
                    applications__status="interview",
                ),
                distinct=True,
            ),
            accepted_applications=Count(
                "applications",
                filter=Q(
                    applications__status="accepted",
                ),
                distinct=True,
            ),
            rejected_applications=Count(
                "applications",
                filter=Q(
                    applications__status="rejected",
                ),
                distinct=True,
            ),
            withdrawn_applications=Count(
                "applications",
                filter=Q(
                    applications__status="withdrawn",
                ),
                distinct=True,
            ),
        )

        jobs = (
            company_jobs.annotate(
                application_count=Count(
                    "applications",
                    distinct=True,
                )
            )
            .values(
                "id",
                "title_en",
                "title_ja",
                "status",
                "deadline",
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