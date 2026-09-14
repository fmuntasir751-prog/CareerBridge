from django.contrib import admin

from .models import Job


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = (
        "title_en",
        "company",
        "employment_type",
        "workplace_type",
        "location",
        "is_active",
        "created_at",
    )

    list_filter = (
        "employment_type",
        "workplace_type",
        "japanese_level",
        "is_active",
    )

    search_fields = (
        "title_en",
        "title_ja",
        "company__username",
        "location",
    )