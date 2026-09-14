from rest_framework.permissions import SAFE_METHODS, BasePermission


class ApplicationPermission(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        if request.method in SAFE_METHODS:
            return request.user.role in ("student", "company")

        if request.method == "POST":
            return request.user.role == "student"

        if request.method in ("PUT", "PATCH"):
            return request.user.role == "company"

        return False

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            if request.user.role == "student":
                return obj.applicant == request.user

            return obj.job.company == request.user

        if request.method in ("PUT", "PATCH"):
            return obj.job.company == request.user

        return False