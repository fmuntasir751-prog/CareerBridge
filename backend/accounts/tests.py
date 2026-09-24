from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core import mail
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


@override_settings(
    EMAIL_BACKEND=(
        "django.core.mail.backends."
        "locmem.EmailBackend"
    ),
    DEFAULT_FROM_EMAIL=(
        "CareerBridge <noreply@careerbridge.test>"
    ),
)
class EmailOTPAPITestCase(APITestCase):
    def setUp(self):
        self.registration_data = {
            "username": "otp_student",
            "email": "otp_student@example.com",
            "first_name": "OTP",
            "last_name": "Student",
            "role": "student",
            "preferred_language": "en",
            "password": "CareerBridge@Test123",
            "password_confirm": (
                "CareerBridge@Test123"
            ),
        }

    def register_user(self):
        with patch(
            "accounts.services.generate_otp",
            return_value="123456",
        ):
            return self.client.post(
                reverse("register"),
                self.registration_data,
                format="json",
            )

    def test_registration_creates_inactive_user(self):
        response = self.register_user()

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        user = User.objects.get(
            email=self.registration_data["email"],
        )

        self.assertFalse(user.is_active)
        self.assertFalse(user.email_verified)
        self.assertNotEqual(user.email_otp, "123456")
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("123456", mail.outbox[0].body)

    def test_correct_otp_verifies_email(self):
        self.register_user()

        response = self.client.post(
            reverse("verify_email"),
            {
                "email": self.registration_data["email"],
                "otp": "123456",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        user = User.objects.get(
            email=self.registration_data["email"],
        )

        self.assertTrue(user.is_active)
        self.assertTrue(user.email_verified)
        self.assertEqual(user.email_otp, "")
        self.assertIsNone(user.email_otp_created_at)

    def test_wrong_otp_is_rejected(self):
        self.register_user()

        response = self.client.post(
            reverse("verify_email"),
            {
                "email": self.registration_data["email"],
                "otp": "999999",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        user = User.objects.get(
            email=self.registration_data["email"],
        )

        self.assertFalse(user.is_active)
        self.assertFalse(user.email_verified)
        self.assertEqual(user.email_otp_attempts, 1)

    def test_expired_otp_is_rejected(self):
        self.register_user()

        user = User.objects.get(
            email=self.registration_data["email"],
        )

        user.email_otp_created_at = (
            timezone.now() - timedelta(minutes=11)
        )

        user.save(
            update_fields=["email_otp_created_at"],
        )

        response = self.client.post(
            reverse("verify_email"),
            {
                "email": self.registration_data["email"],
                "otp": "123456",
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        user.refresh_from_db()

        self.assertFalse(user.is_active)
        self.assertFalse(user.email_verified)

    def test_resend_cooldown_is_enforced(self):
        self.register_user()

        response = self.client.post(
            reverse("resend_verification"),
            {
                "email": self.registration_data["email"],
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertEqual(len(mail.outbox), 1)

    def test_resend_sends_new_code_after_cooldown(self):
        self.register_user()

        user = User.objects.get(
            email=self.registration_data["email"],
        )

        user.email_otp_created_at = (
            timezone.now() - timedelta(seconds=61)
        )

        user.save(
            update_fields=["email_otp_created_at"],
        )

        with patch(
            "accounts.services.generate_otp",
            return_value="654321",
        ):
            response = self.client.post(
                reverse("resend_verification"),
                {
                    "email": (
                        self.registration_data["email"]
                    ),
                },
                format="json",
            )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(len(mail.outbox), 2)
        self.assertIn("654321", mail.outbox[1].body)

    def test_unverified_user_cannot_log_in(self):
        self.register_user()

        response = self.client.post(
            reverse("login"),
            {
                "username": (
                    self.registration_data["username"]
                ),
                "password": (
                    self.registration_data["password"]
                ),
            },
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED,
        )