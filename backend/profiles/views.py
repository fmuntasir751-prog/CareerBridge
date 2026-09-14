from rest_framework import generics
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated

from .models import CompanyProfile, StudentProfile
from .serializers import CompanyProfileSerializer, StudentProfileSerializer


class StudentProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = StudentProfileSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        user = self.request.user

        if user.role != "student":
            raise PermissionDenied(
                "Only student accounts can access this profile."
            )

        profile, _ = StudentProfile.objects.get_or_create(user=user)
        return profile


class CompanyProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = CompanyProfileSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        user = self.request.user

        if user.role != "company":
            raise PermissionDenied(
                "Only company accounts can access this profile."
            )

        profile, _ = CompanyProfile.objects.get_or_create(
            user=user,
            defaults={"company_name": user.username},
        )
        return profile