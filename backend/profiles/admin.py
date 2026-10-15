from django.contrib import admin
from django.utils import timezone

from .models import (
    CompanyProfile,
    ResumeAnalysis,
    StudentProfile,
)


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "university",
        "graduation_year",
        "location",
    )

    search_fields = (
        "user__username",
        "user__email",
        "skills",
    )

    list_filter = (
        "japanese_level",
        "preferred_workplace",
    )


@admin.action(
    description="Verify selected companies",
)
def verify_companies(
    modeladmin,
    request,
    queryset,
):
    queryset.update(
        verification_status=(
            CompanyProfile
            .VerificationStatus
            .VERIFIED
        ),
        verified_at=timezone.now(),
        verification_note="",
    )


@admin.action(
    description="Reject selected companies",
)
def reject_companies(
    modeladmin,
    request,
    queryset,
):
    queryset.update(
        verification_status=(
            CompanyProfile
            .VerificationStatus
            .REJECTED
        ),
        verified_at=None,
    )


@admin.action(
    description="Return selected companies to pending",
)
def mark_companies_pending(
    modeladmin,
    request,
    queryset,
):
    queryset.update(
        verification_status=(
            CompanyProfile
            .VerificationStatus
            .PENDING
        ),
        verified_at=None,
    )


@admin.register(CompanyProfile)
class CompanyProfileAdmin(admin.ModelAdmin):
    list_display = (
        "company_name",
        "user",
        "registration_number",
        "verification_status",
        "verified_at",
        "location",
    )

    search_fields = (
        "company_name",
        "user__username",
        "user__email",
        "registration_number",
        "contact_person",
        "location",
    )

    list_filter = (
        "verification_status",
        "location",
        "created_at",
    )

    readonly_fields = (
        "verified_at",
        "created_at",
        "updated_at",
    )

    actions = (
        verify_companies,
        reject_companies,
        mark_companies_pending,
    )

    fieldsets = (
        (
            "Company information",
            {
                "fields": (
                    "user",
                    "company_name",
                    "description",
                    "website",
                    "location",
                    "logo",
                ),
            },
        ),
        (
            "Official information",
            {
                "fields": (
                    "registration_number",
                    "contact_person",
                ),
            },
        ),
        (
            "Verification",
            {
                "fields": (
                    "verification_status",
                    "verification_note",
                    "verified_at",
                ),
            },
        ),
        (
            "System information",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                ),
            },
        ),
    )


@admin.register(ResumeAnalysis)
class ResumeAnalysisAdmin(admin.ModelAdmin):
    list_display = (
        "student_profile",
        "resume_name",
        "status",
        "overall_score",
        "language",
        "created_at",
    )

    search_fields = (
        "student_profile__user__username",
        "student_profile__user__email",
        "resume_name",
    )

    list_filter = (
        "status",
        "language",
        "created_at",
    )

    readonly_fields = (
        "resume_hash",
        "created_at",
        "updated_at",
    )