from django.contrib import admin

from .models import CompanyProfile, StudentProfile


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "university", "graduation_year", "location")
    search_fields = ("user__username", "user__email", "skills")


@admin.register(CompanyProfile)
class CompanyProfileAdmin(admin.ModelAdmin):
    list_display = ("company_name", "user", "location", "website")
    search_fields = ("company_name", "user__email", "location")