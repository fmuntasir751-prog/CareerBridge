from rest_framework import serializers

from jobs.matching import calculate_job_match

from .models import Application


class ApplicationSerializer(serializers.ModelSerializer):
    applicant_name = serializers.CharField(
        source="applicant.username",
        read_only=True,
    )

    applicant_email = serializers.EmailField(
        source="applicant.email",
        read_only=True,
    )

    job_title = serializers.CharField(
        source="job.title_en",
        read_only=True,
    )

    job_title_ja = serializers.CharField(
        source="job.title_ja",
        read_only=True,
    )

    company_name = serializers.SerializerMethodField()

    applicant_match_score = (
        serializers.SerializerMethodField()
    )

    applicant_match_analysis = (
        serializers.SerializerMethodField()
    )

    class Meta:
        model = Application

        fields = (
            "id",
            "job",
            "job_title",
            "job_title_ja",
            "company_name",
            "applicant",
            "applicant_name",
            "applicant_email",
            "cover_letter",
            "resume",
            "status",
            "applicant_match_score",
            "applicant_match_analysis",
            "applied_at",
            "updated_at",
        )

        read_only_fields = (
            "id",
            "applicant",
            "applicant_name",
            "applicant_email",
            "job_title",
            "job_title_ja",
            "company_name",
            "status",
            "applicant_match_score",
            "applicant_match_analysis",
            "applied_at",
            "updated_at",
        )

    def get_company_name(self, obj):
        profile = getattr(
            obj.job.company,
            "company_profile",
            None,
        )

        if profile:
            return profile.company_name

        return obj.job.company.username

    def get_match_analysis(self, obj):
        if not hasattr(self, "_match_cache"):
            self._match_cache = {}

        if obj.pk in self._match_cache:
            return self._match_cache[obj.pk]

        request = self.context.get("request")

        empty_result = None

        if (
            request is None
            or not request.user.is_authenticated
            or getattr(request.user, "role", None)
            != "company"
            or obj.job.company_id
            != request.user.id
        ):
            self._match_cache[obj.pk] = empty_result
            return empty_result

        profile = getattr(
            obj.applicant,
            "student_profile",
            None,
        )

        if profile is None:
            self._match_cache[obj.pk] = empty_result
            return empty_result

        result = calculate_job_match(
            profile,
            obj.job,
        )

        self._match_cache[obj.pk] = result

        return result

    def get_applicant_match_score(self, obj):
        analysis = self.get_match_analysis(obj)

        if analysis is None:
            return None

        return analysis["match_score"]

    def get_applicant_match_analysis(self, obj):
        return self.get_match_analysis(obj)

    def validate_job(self, job):
        company_profile = getattr(
            job.company,
            "company_profile",
            None,
        )

        if (
            company_profile is None
            or not company_profile.is_verified
        ):
            raise serializers.ValidationError(
                "This company is not verified."
            )

        if not job.accepts_applications:
            if job.effective_status == "expired":
                raise serializers.ValidationError(
                    "The application deadline "
                    "has expired."
                )

            if job.effective_status == "draft":
                raise serializers.ValidationError(
                    "This job has not been "
                    "published yet."
                )

            raise serializers.ValidationError(
                "Applications for this job "
                "are closed."
            )

        return job


class ApplicationStatusSerializer(
    serializers.ModelSerializer,
):
    class Meta:
        model = Application
        fields = (
            "id",
            "status",
        )
        read_only_fields = ("id",)