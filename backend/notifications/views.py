from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(
            recipient=self.request.user,
        ).select_related(
            "application",
            "application__job",
        )

    @action(
        detail=False,
        methods=["get"],
        url_path="unread-count",
    )
    def unread_count(self, request):
        count = self.get_queryset().filter(
            is_read=False,
        ).count()

        return Response({"count": count})

    @action(
        detail=True,
        methods=["patch"],
        url_path="read",
    )
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()

        if not notification.is_read:
            notification.is_read = True
            notification.save(
                update_fields=["is_read"],
            )

        serializer = self.get_serializer(notification)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    @action(
        detail=False,
        methods=["patch"],
        url_path="read-all",
    )
    def mark_all_as_read(self, request):
        updated = self.get_queryset().filter(
            is_read=False,
        ).update(is_read=True)

        return Response(
            {
                "detail": "Notifications marked as read.",
                "updated": updated,
            },
            status=status.HTTP_200_OK,
        )