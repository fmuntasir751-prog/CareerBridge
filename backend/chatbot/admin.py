from django.contrib import admin

from .models import ChatMessage


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = [
        "user",
        "role",
        "language",
        "created_at",
    ]

    list_filter = [
        "role",
        "language",
        "created_at",
    ]

    search_fields = [
        "user__username",
        "message",
    ]