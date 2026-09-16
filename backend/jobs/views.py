from django.db.models import Q
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Job, SavedJob
from .permissions import IsCompanyOwnerOrReadOnly
from .serializers import JobSerializer
from rest_framework import filters, status, viewsets

class JobViewSet(viewsets.ModelViewSet):
    serializer_class = JobSerializer
    permission_classes = [IsCompanyOwnerOrReadOnly]

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
    ]

    ordering_fields = [
        "created_at",
        "deadline",
        "salary_min",
        "salary_max",
    ]
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
            saved_job, created = (
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

        deleted_count, _ = SavedJob.objects.filter(
            user=request.user,
            job=job,
        ).delete()

        return Response(
            {
                "detail": (
                    "Job was removed from saved jobs."
                    if deleted_count
                    else "Job was not saved."
                ),
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
                "Only student accounts can view saved jobs."
            )

        jobs = Job.objects.filter(
            saved_by_users__user=request.user,
        ).select_related("company").order_by(
            "-saved_by_users__created_at",
        )

        serializer = self.get_serializer(
            jobs,
            many=True,
        )

        return Response(serializer.data)
    def get_queryset(self):
        queryset = Job.objects.select_related("company")

        if self.action == "list":
            return queryset.filter(is_active=True)

        if self.action == "retrieve":
            user = self.request.user

            if user.is_authenticated:
                return queryset.filter(
                    Q(is_active=True) | Q(company=user)
                )

            return queryset.filter(is_active=True)

        return queryset

    def perform_create(self, serializer):
        serializer.save(company=self.request.user)

    @action(
        detail=False,
        methods=["get"],
        url_path="mine",
    )
    def my_jobs(self, request):
        if (
            not request.user.is_authenticated
            or request.user.role != "company"
        ):
            raise PermissionDenied(
                "Only company accountsHolder can manage jobs."
            )

        jobs = (
            Job.objects.filter(company=request.user)
            .select_related("company")
            .order_by("-created_at")
        )

        serializer = self.get_serializer(
            jobs,
            many=True,
        )

        return Response(serializer.data)