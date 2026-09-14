from django.db.models import Q
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from .models import Job
from .permissions import IsCompanyOwnerOrReadOnly
from .serializers import JobSerializer


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