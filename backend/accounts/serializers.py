from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .services import (
    OTP_MAX_ATTEMPTS,
    create_and_send_email_otp,
    otp_has_expired,
)

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        validators=[validate_password],
    )
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "preferred_language",
            "password",
            "password_confirm",
        )
        read_only_fields = ("id",)

    def validate_role(self, value):
        if value == User.Role.ADMIN:
            raise serializers.ValidationError(
                "Admin accounts cannot be created from registration."
            )

        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {
                    "password_confirm": (
                        "Passwords do not match."
                    ),
                },
            )

        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")

        user = User.objects.create_user(
            password=password,
            is_active=False,
            email_verified=False,
            **validated_data,
        )

        create_and_send_email_otp(user)

        return user


class EmailOTPVerificationSerializer(
    serializers.Serializer,
):
    email = serializers.EmailField()
    otp = serializers.CharField(
        min_length=6,
        max_length=6,
        trim_whitespace=True,
    )

    def validate(self, attrs):
        try:
            user = User.objects.get(
                email__iexact=attrs["email"],
            )
        except User.DoesNotExist:
            raise serializers.ValidationError(
                "Invalid email address or verification code.",
            )

        if user.email_verified:
            raise serializers.ValidationError(
                "This email address is already verified.",
            )

        if user.email_otp_attempts >= OTP_MAX_ATTEMPTS:
            raise serializers.ValidationError(
                "Too many incorrect attempts. Request a new code.",
            )

        if otp_has_expired(user):
            raise serializers.ValidationError(
                "The verification code has expired. Request a new code.",
            )

        if not check_password(
            attrs["otp"],
            user.email_otp,
        ):
            user.email_otp_attempts += 1
            user.save(
                update_fields=["email_otp_attempts"],
            )

            remaining_attempts = (
                OTP_MAX_ATTEMPTS
                - user.email_otp_attempts
            )

            raise serializers.ValidationError(
                {
                    "otp": (
                        "Incorrect verification code. "
                        f"{remaining_attempts} attempts remaining."
                    ),
                },
            )

        attrs["user"] = user
        return attrs

    def save(self):
        user = self.validated_data["user"]

        user.email_verified = True
        user.is_active = True
        user.email_otp = ""
        user.email_otp_created_at = None
        user.email_otp_attempts = 0

        user.save(
            update_fields=[
                "email_verified",
                "is_active",
                "email_otp",
                "email_otp_created_at",
                "email_otp_attempts",
            ],
        )

        return user


class ResendEmailOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            user = User.objects.get(
                email__iexact=value,
            )
        except User.DoesNotExist:
            raise serializers.ValidationError(
                "No account was found with this email address.",
            )

        if user.email_verified:
            raise serializers.ValidationError(
                "This email address is already verified.",
            )

        self.context["otp_user"] = user
        return value

    def save(self):
        user = self.context["otp_user"]
        create_and_send_email_otp(user)
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "preferred_language",
            "email_verified",
        )