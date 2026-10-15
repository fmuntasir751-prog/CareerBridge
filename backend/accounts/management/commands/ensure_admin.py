import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Create or update the production administrator."

    def handle(self, *args, **options):
        username = os.environ.get(
            "DJANGO_ADMIN_USERNAME",
        )
        email = os.environ.get(
            "DJANGO_ADMIN_EMAIL",
        )
        password = os.environ.get(
            "DJANGO_ADMIN_PASSWORD",
        )

        if not all([username, email, password]):
            self.stdout.write(
                self.style.WARNING(
                    "Admin environment variables are not set. "
                    "Skipping administrator setup."
                )
            )
            return

        if len(password) < 12:
            raise CommandError(
                "DJANGO_ADMIN_PASSWORD must contain "
                "at least 12 characters."
            )

        User = get_user_model()

        user = User.objects.filter(
            email__iexact=email,
        ).first()

        if user is None:
            user = User.objects.filter(
                username=username,
            ).first()

        created = user is None

        if created:
            user = User(
                username=username,
                email=email,
            )
        else:
            user.username = username
            user.email = email

        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.set_password(password)
        user.save()

        action = "created" if created else "updated"

        self.stdout.write(
            self.style.SUCCESS(
                f"Administrator {action}: {user.username}"
            )
        )