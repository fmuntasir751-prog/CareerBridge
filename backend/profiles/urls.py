from django.urls import path

from .views import (
    CompanyProfileView,
    StudentProfileView,
    StudentProgressView,
)


urlpatterns = [
    path(
        "student/me/",
        StudentProfileView.as_view(),
        name="student-profile",
    ),
    path(
        "student/progress/",
        StudentProgressView.as_view(),
        name="student-progress",
    ),
    path(
        "company/me/",
        CompanyProfileView.as_view(),
        name="company-profile",
    ),
]