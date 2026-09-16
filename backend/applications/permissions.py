from rest_framework.permissions import (
    SAFE_METHODS,
    BasePermission,
)


class ApplicationPermission(BasePermission):
    def has_permission(self, request, view):
        user = request.user

        if not user.is_authenticated:
            return False

        if request.method in SAFE_METHODS:
            return user.role in ("student", "company")

        if request.method == "POST":
            return user.role == "student"

        if request.method in ("PUT", "PATCH"):
            return user.role == "company"

        return False

    def has_object_permission(
        self,
        request,
        view,
        obj,
    ):
        user = request.user

        if request.method in SAFE_METHODS:
            if user.role == "student":
                return obj.applicant == user

            if user.role == "company":
                return obj.job.company == user

            return False

        if (
            view.action == "withdraw"
            and request.method == "POST"
        ):
            return (
                user.role == "student"
                and obj.applicant == user
            )

        if request.method in ("PUT", "PATCH"):
            return (
                user.role == "company"
                and obj.job.company == user
            )

        return False