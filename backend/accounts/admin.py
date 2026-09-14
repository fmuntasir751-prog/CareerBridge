from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        (
            "CareerBridge Information",
            {
                "fields": (
                    "role",
                    "preferred_language",
                )
            },
        ),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        (
            "CareerBridge Information",
            {
                "fields": (
                    "email",
                    "role",
                    "preferred_language",
                )
            },
        ),
    )

    list_display = (
        "username",
        "email",
        "role",
        "preferred_language",
        "is_staff",
    )

    list_filter = (
        "role",
        "preferred_language",
        "is_staff",
    )