from django.conf import settings
from django.db import models

from applications.models import Application


class Notification(models.Model):
    class Type(models.TextChoices):
        APPLICATION_STATUS = (
            "application_status",
            "Application status",
        )

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name="notifications",
        blank=True,
        null=True,
    )

    notification_type = models.CharField(
        max_length=40,
        choices=Type.choices,
        default=Type.APPLICATION_STATUS,
    )

    title_en = models.CharField(max_length=200)
    title_ja = models.CharField(max_length=200)

    message_en = models.TextField()
    message_ja = models.TextField()

    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"{self.recipient.username}: "
            f"{self.title_en}"
        )