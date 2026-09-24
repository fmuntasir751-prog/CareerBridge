import secrets
from datetime import timedelta

import requests
from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.core.mail import send_mail
from django.utils import timezone


OTP_EXPIRY_MINUTES = 10
OTP_RESEND_SECONDS = 60
OTP_MAX_ATTEMPTS = 5


def generate_otp():
    return f"{secrets.randbelow(1_000_000):06d}"


def get_email_content(user, otp):
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

    return subject, message


def send_otp_email(user, otp):
    subject, message = get_email_content(user, otp)
    api_key = getattr(settings, "BREVO_API_KEY", "")

    # Local development and automated tests
    if not api_key:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        return

    sender_email = settings.BREVO_SENDER_EMAIL
    sender_name = settings.BREVO_SENDER_NAME

    if not sender_email:
        raise RuntimeError("BREVO_SENDER_EMAIL is not configured.")

    response = requests.post(
        "https://api.brevo.com/v3/smtp/email",
        headers={
            "accept": "application/json",
            "api-key": api_key,
            "content-type": "application/json",
        },
        json={
            "sender": {
                "name": sender_name,
                "email": sender_email,
            },
            "to": [
                {
                    "email": user.email,
                    "name": user.get_full_name() or user.username,
                }
            ],
            "subject": subject,
            "textContent": message,
            "tags": ["careerbridge-otp"],
        },
        timeout=15,
    )
    response.raise_for_status()


def create_and_send_email_otp(user):
    otp = generate_otp()

    send_otp_email(user, otp)

    user.email_otp = make_password(otp)
    user.email_otp_created_at = timezone.now()
    user.email_otp_attempts = 0
    user.save(
        update_fields=[
            "email_otp",
            "email_otp_created_at",
            "email_otp_attempts",
        ]
    )


def otp_has_expired(user):
    if not user.email_otp_created_at:
        return True

    expiry_time = user.email_otp_created_at + timedelta(
        minutes=OTP_EXPIRY_MINUTES
    )
    return timezone.now() > expiry_time


def otp_can_be_resent(user):
    if not user.email_otp_created_at:
        return True

    resend_time = user.email_otp_created_at + timedelta(
        seconds=OTP_RESEND_SECONDS
    )
    return timezone.now() >= resend_time