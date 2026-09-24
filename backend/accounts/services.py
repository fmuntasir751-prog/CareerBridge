import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.core.mail import send_mail
from django.utils import timezone


OTP_EXPIRY_MINUTES = 10
OTP_RESEND_SECONDS = 60
OTP_MAX_ATTEMPTS = 5


def generate_otp():
    return str(secrets.randbelow(900000) + 100000)


def create_and_send_email_otp(user):
    otp = generate_otp()

    user.email_otp = make_password(otp)
    user.email_otp_created_at = timezone.now()
    user.email_otp_attempts = 0

    user.save(
        update_fields=[
            "email_otp",
            "email_otp_created_at",
            "email_otp_attempts",
        ],
    )

    if user.preferred_language == "ja":
        subject = "CareerBridge メール認証コード"
        message = (
            f"CareerBridgeの認証コードは {otp} です。\n\n"
            f"このコードは{OTP_EXPIRY_MINUTES}分間有効です。"
        )
    else:
        subject = "CareerBridge email verification code"
        message = (
            f"Your CareerBridge verification code is {otp}.\n\n"
            f"This code expires in {OTP_EXPIRY_MINUTES} minutes."
        )

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )


def otp_has_expired(user):
    if not user.email_otp_created_at:
        return True

    expiry_time = user.email_otp_created_at + timedelta(
        minutes=OTP_EXPIRY_MINUTES,
    )

    return timezone.now() > expiry_time


def otp_can_be_resent(user):
    if not user.email_otp_created_at:
        return True

    resend_time = user.email_otp_created_at + timedelta(
        seconds=OTP_RESEND_SECONDS,
    )

    return timezone.now() >= resend_time