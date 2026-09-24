from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views import (
    CurrentUserView,
    RegisterView,
    ResendEmailOTPView,
    VerifyEmailOTPView,
)

urlpatterns = [
    path(
        "register/",
        RegisterView.as_view(),
        name="register",
    ),
    path(
        "verify-email/",
        VerifyEmailOTPView.as_view(),
        name="verify_email",
    ),
    path(
        "resend-verification/",
        ResendEmailOTPView.as_view(),
        name="resend_verification",
    ),
    path(
        "login/",
        TokenObtainPairView.as_view(),
        name="login",
    ),
    path(
        "token/refresh/",
        TokenRefreshView.as_view(),
        name="token_refresh",
    ),
    path(
        "me/",
        CurrentUserView.as_view(),
        name="current_user",
    ),
]