from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import (
    FormParser,
    JSONParser,
    MultiPartParser,
)
from rest_framework.response import Response

from notifications.models import Notification

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
            return queryset.filter(
                applicant=user,
            )

        if user.role == "company":
            return queryset.filter(
                job__company=user,
            )

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

    def perform_update(self, serializer):
        previous_status = (
            serializer.instance.status
        )

        application = serializer.save()

        if previous_status == application.status:
            return

        status_labels_en = {
            Application.Status.PENDING: "Pending",
            Application.Status.REVIEWING: "Reviewing",
            Application.Status.INTERVIEW: "Interview",
            Application.Status.ACCEPTED: "Accepted",
            Application.Status.REJECTED: "Rejected",
            Application.Status.WITHDRAWN: "Withdrawn",
        }

        status_labels_ja = {
            Application.Status.PENDING: "応募済み",
            Application.Status.REVIEWING: "選考中",
            Application.Status.INTERVIEW: "面接",
            Application.Status.ACCEPTED: "採用",
            Application.Status.REJECTED: "不採用",
            Application.Status.WITHDRAWN: "辞退",
        }

        job_title_en = application.job.title_en

        job_title_ja = (
            application.job.title_ja
            or application.job.title_en
        )

        status_en = status_labels_en.get(
            application.status,
            application.status,
        )

        status_ja = status_labels_ja.get(
            application.status,
            application.status,
        )

        Notification.objects.create(
            recipient=application.applicant,
            application=application,
            notification_type=(
                Notification.Type.APPLICATION_STATUS
            ),
            title_en=(
                "Application status updated"
            ),
            title_ja="応募状況が更新されました",
            message_en=(
                f'Your application for "{job_title_en}" '
                f"is now {status_en}."
            ),
            message_ja=(
                f"「{job_title_ja}」への応募状況が"
                f"「{status_ja}」に更新されました。"
            ),
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="withdraw",
    )
    def withdraw(self, request, pk=None):
        application = self.get_object()

        if (
            application.status
            == Application.Status.WITHDRAWN
        ):
            raise ValidationError(
                "This application is already withdrawn."
            )

        if application.status in (
            Application.Status.ACCEPTED,
            Application.Status.REJECTED,
        ):
            raise ValidationError(
                "A completed application cannot be "
                "withdrawn."
            )

        application.status = (
            Application.Status.WITHDRAWN
        )

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