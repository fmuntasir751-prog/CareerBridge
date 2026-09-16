from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import (
    FormParser,
    JSONParser,
    MultiPartParser,
)
from rest_framework.response import Response

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

    parser_classes = [
        MultiPartParser,
        FormParser,
        JSONParser,
    ]

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
        if self.action in (
            "update",
            "partial_update",
        ):
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

    @action(
        detail=True,
        methods=["post"],
        url_path="withdraw",
    )
    def withdraw(self, request, pk=None):
        application = self.get_object()

        if application.status == Application.Status.WITHDRAWN:
            raise ValidationError(
                "This application is already withdrawn."
            )

        if application.status in (
            Application.Status.ACCEPTED,
            Application.Status.REJECTED,
        ):
            raise ValidationError(
                "A completed application cannot be withdrawn."
            )

        application.status = Application.Status.WITHDRAWN

        application.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        serializer = ApplicationSerializer(
            application,
            context=self.get_serializer_context(),
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )