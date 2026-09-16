from rest_framework import serializers

from .models import Notification


class NotificationSerializer(
    serializers.ModelSerializer,
):
    job_id = serializers.IntegerField(
        source="application.job_id",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = Notification
        fields = (
            "id",
            "notification_type",
            "application",
            "job_id",
            "title_en",
            "title_ja",
            "message_en",
            "message_ja",
            "is_read",
            "created_at",
        )

        read_only_fields = fields