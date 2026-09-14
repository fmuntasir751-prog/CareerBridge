from django.urls import path

from .views import CompanyProfileView, StudentProfileView

urlpatterns = [
    path(
        "student/me/",
        StudentProfileView.as_view(),
        name="student-profile",
    ),
    path(
        "company/me/",
        CompanyProfileView.as_view(),
        name="company-profile",
    ),
]