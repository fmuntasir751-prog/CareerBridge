from rest_framework import mixins, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser

from .models import Application
from .permissions import ApplicationPermission
from .serializers import (
    ApplicationSerializer,
    ApplicationStatusSerializer,
)


class ApplicationViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [ApplicationPermission]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user

        queryset = Application.objects.select_related(
            "job",
            "job__company",
            "applicant",
        )

        if user.role == "student":
            return queryset.filter(applicant=user)

        if user.role == "company":
            return queryset.filter(job__company=user)

        return queryset.none()

    def get_serializer_class(self):
        if self.action in ("update", "partial_update"):
            return ApplicationStatusSerializer

        return ApplicationSerializer

    def perform_create(self, serializer):
        user = self.request.user
        job = serializer.validated_data["job"]

        if Application.objects.filter(
            job=job,
            applicant=user,
        ).exists():
            raise ValidationError(
                "You have already applied for this job."
            )

        serializer.save(
            applicant=user,
            status=Application.Status.PENDING,
        )