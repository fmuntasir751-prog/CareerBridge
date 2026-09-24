from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .serializers import (
    EmailOTPVerificationSerializer,
    RegisterSerializer,
    ResendEmailOTPSerializer,
    UserSerializer,
)
from .services import otp_can_be_resent

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(
            data=request.data,
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response(
            {
                "detail": (
                    "Account created. Check your email "
                    "for the verification code."
                ),
                "email": user.email,
            },
            status=status.HTTP_201_CREATED,
        )


class VerifyEmailOTPView(generics.GenericAPIView):
    serializer_class = EmailOTPVerificationSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = self.get_serializer(
            data=request.data,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {
                "detail": (
                    "Email verified successfully. "
                    "You can now log in."
                ),
            },
            status=status.HTTP_200_OK,
        )


class ResendEmailOTPView(generics.GenericAPIView):
    serializer_class = ResendEmailOTPSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = self.get_serializer(
            data=request.data,
        )
        serializer.is_valid(raise_exception=True)

        user = serializer.context["otp_user"]

        if not otp_can_be_resent(user):
            raise ValidationError(
                {
                    "detail": (
                        "Please wait before requesting "
                        "another verification code."
                    ),
                },
            )

        serializer.save()

        return Response(
            {
                "detail": (
                    "A new verification code "
                    "was sent to your email."
                ),
            },
            status=status.HTTP_200_OK,
        )


class CurrentUserView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user