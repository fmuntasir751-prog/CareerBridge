import os
from pathlib import Path

import dj_database_url


BASE_DIR = Path(__file__).resolve().parent.parent


def get_boolean_environment(name, default=False):
    value = os.environ.get(name)

    if value is None:
        return default

    return value.lower() in (
        "1",
        "true",
        "yes",
        "on",
    )


def get_list_environment(name, default=""):
    value = os.environ.get(name, default)

    return [
        item.strip()
        for item in value.split(",")
        if item.strip()
    ]


SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "unsafe-careerbridge-development-key",
)

DEBUG = get_boolean_environment(
    "DJANGO_DEBUG",
    default=True,
)

ALLOWED_HOSTS = get_list_environment(
    "DJANGO_ALLOWED_HOSTS",
    default="127.0.0.1,localhost",
)


INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "rest_framework",
    "corsheaders",

    "accounts",
    "profiles.apps.ProfilesConfig",
    "jobs",
    "applications",
    "chatbot",
    "notifications",
]


MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    (
        "whitenoise.middleware."
        "WhiteNoiseMiddleware"
    ),
    "corsheaders.middleware.CorsMiddleware",
    (
        "django.contrib.sessions.middleware."
        "SessionMiddleware"
    ),
    "django.middleware.common.CommonMiddleware",
    (
        "django.middleware.csrf."
        "CsrfViewMiddleware"
    ),
    (
        "django.contrib.auth.middleware."
        "AuthenticationMiddleware"
    ),
    (
        "django.contrib.messages.middleware."
        "MessageMiddleware"
    ),
    (
        "django.middleware.clickjacking."
        "XFrameOptionsMiddleware"
    ),
]


ROOT_URLCONF = "config.urls"


TEMPLATES = [
    {
        "BACKEND": (
            "django.template.backends.django."
            "DjangoTemplates"
        ),
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                (
                    "django.template.context_processors."
                    "request"
                ),
                (
                    "django.contrib.auth.context_processors."
                    "auth"
                ),
                (
                    "django.contrib.messages.context_processors."
                    "messages"
                ),
            ],
        },
    },
]


WSGI_APPLICATION = "config.wsgi.application"


database_url = os.environ.get("DATABASE_URL")

if database_url:
    DATABASES = {
        "default": dj_database_url.parse(
            database_url,
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": (
                "django.db.backends.sqlite3"
            ),
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }


AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "UserAttributeSimilarityValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "MinimumLengthValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "CommonPasswordValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "NumericPasswordValidator"
        ),
    },
]


LANGUAGE_CODE = "en-us"

TIME_ZONE = "Asia/Tokyo"

USE_I18N = True

USE_TZ = True


STATIC_URL = "/static/"

STATIC_ROOT = BASE_DIR / "staticfiles"

STORAGES = {
    "default": {
        "BACKEND": (
            "django.core.files.storage."
            "FileSystemStorage"
        ),
    },
    "staticfiles": {
        "BACKEND": (
            "whitenoise.storage."
            "CompressedManifestStaticFilesStorage"
        ),
    },
}


MEDIA_URL = "/media/"

MEDIA_ROOT = BASE_DIR / "media"


DEFAULT_AUTO_FIELD = (
    "django.db.models.BigAutoField"
)

AUTH_USER_MODEL = "accounts.User"


REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        (
            "rest_framework_simplejwt."
            "authentication.JWTAuthentication"
        ),
    ),
}


default_cors_origins = (
    "http://localhost:5173,"
    "http://127.0.0.1:5173"
)

CORS_ALLOWED_ORIGINS = get_list_environment(
    "CORS_ALLOWED_ORIGINS",
    default=default_cors_origins,
)

CSRF_TRUSTED_ORIGINS = get_list_environment(
    "CSRF_TRUSTED_ORIGINS",
)


EMAIL_BACKEND = os.environ.get(
    "EMAIL_BACKEND",
    (
        "django.core.mail.backends."
        "console.EmailBackend"
    ),
)


SECURE_PROXY_SSL_HEADER = (
    "HTTP_X_FORWARDED_PROTO",
    "https",
)

SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SECURE_SSL_REDIRECT = get_boolean_environment(
    "DJANGO_SECURE_SSL_REDIRECT",
    default=False,
)