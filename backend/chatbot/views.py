import os
import re

from django.db.models import Q
from google import genai
from google.genai import types
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from jobs.models import Job

from .models import ChatMessage
from .serializers import (
    ChatMessageSerializer,
    ChatRequestSerializer,
)


def extract_salary(text):
    japanese_salary = re.search(
        r"(\d+(?:\.\d+)?)\s*万",
        text,
    )

    if japanese_salary:
        return int(
            float(japanese_salary.group(1)) * 10000
        )

    numbers = re.findall(
        r"(?:¥|￥)?\s*(\d[\d,]*)",
        text,
    )

    values = []

    for number in numbers:
        try:
            value = int(
                number.replace(",", "")
            )

            if value >= 10000:
                values.append(value)

        except ValueError:
            continue

    return max(values) if values else None


def find_matching_jobs(message):
    text = message.lower()

    queryset = Job.objects.filter(
        is_active=True,
    ).select_related("company")

    location_map = {
        "osaka": "Osaka",
        "大阪": "Osaka",
        "tokyo": "Tokyo",
        "東京": "Tokyo",
        "kyoto": "Kyoto",
        "京都": "Kyoto",
        "kobe": "Kobe",
        "神戸": "Kobe",
        "nagoya": "Nagoya",
        "名古屋": "Nagoya",
        "fukuoka": "Fukuoka",
        "福岡": "Fukuoka",
        "yokohama": "Yokohama",
        "横浜": "Yokohama",
    }

    selected_location = next(
        (
            database_location
            for keyword, database_location
            in location_map.items()
            if keyword in text
        ),
        None,
    )

    if selected_location:
        queryset = queryset.filter(
            location__icontains=(
                selected_location
            ),
        )

    skill_map = {
        "frontend": [
            "frontend",
            "front-end",
            "フロントエンド",
        ],
        "backend": [
            "backend",
            "back-end",
            "バックエンド",
        ],
        "full stack": [
            "full stack",
            "full-stack",
            "フルスタック",
        ],
        "react": ["react"],
        "javascript": ["javascript"],
        "python": ["python"],
        "django": ["django"],
        "designer": [
            "designer",
            "デザイナー",
        ],
        "developer": [
            "developer",
            "開発者",
        ],
        "engineer": [
            "engineer",
            "エンジニア",
        ],
    }

    selected_terms = []

    for (
        search_keyword,
        database_terms,
    ) in skill_map.items():
        keyword_found = (
            search_keyword in text
        )

        translated_term_found = any(
            term.lower() in text
            for term in database_terms
        )

        if (
            keyword_found
            or translated_term_found
        ):
            selected_terms.extend(
                database_terms
            )

    if selected_terms:
        skill_query = Q()

        for term in selected_terms:
            skill_query |= Q(
                title_en__icontains=term,
            )

            skill_query |= Q(
                title_ja__icontains=term,
            )

            skill_query |= Q(
                description_en__icontains=term,
            )

            skill_query |= Q(
                description_ja__icontains=term,
            )

            skill_query |= Q(
                requirements__icontains=term,
            )

        queryset = queryset.filter(
            skill_query,
        )

    minimum_salary = extract_salary(
        message,
    )

    if minimum_salary:
        queryset = queryset.filter(
            Q(
                salary_max__gte=(
                    minimum_salary
                ),
            )
            | Q(
                salary_min__gte=(
                    minimum_salary
                ),
            ),
        )

    return queryset.order_by(
        "-salary_max",
        "-created_at",
    )[:5]


def recommend_jobs_from_profile(user):
    profile = getattr(
        user,
        "student_profile",
        None,
    )

    if profile is None:
        return [], "profile_missing"

    skills = [
        skill.strip().lower()
        for skill in profile.skills.split(",")
        if skill.strip()
    ]

    headline = (
        profile.headline.strip().lower()
    )

    location = (
        profile.location.strip().lower()
    )

    if (
        not skills
        and not headline
        and not location
    ):
        return [], "profile_incomplete"

    jobs = Job.objects.filter(
        is_active=True,
    ).select_related("company")

    recommendations = []

    for job in jobs:
        title_text = " ".join(
            [
                job.title_en or "",
                job.title_ja or "",
            ]
        ).lower()

        searchable_text = " ".join(
            [
                title_text,
                job.description_en or "",
                job.description_ja or "",
                job.requirements or "",
            ]
        ).lower()

        matched_skills = [
            skill
            for skill in skills
            if skill in searchable_text
        ]

        match_percentage = 0

        if skills:
            skill_percentage = (
                len(matched_skills)
                / len(skills)
            ) * 70

            match_percentage += (
                skill_percentage
            )

        headline_words = [
            word
            for word in headline.split()
            if len(word) >= 3
        ]

        headline_matched = bool(
            headline_words
            and any(
                word in title_text
                for word in headline_words
            )
        )

        if headline_matched:
            match_percentage += 15

        location_matched = bool(
            location
            and location
            in (job.location or "").lower()
        )

        if location_matched:
            match_percentage += 15

        match_percentage = min(
            round(match_percentage),
            100,
        )

        if match_percentage > 0:
            recommendations.append(
                {
                    "job": job,
                    "match_percentage": (
                        match_percentage
                    ),
                    "matched_skills": (
                        matched_skills
                    ),
                    "location_matched": (
                        location_matched
                    ),
                }
            )

    recommendations.sort(
        key=lambda item: (
            item["match_percentage"],
            item["job"].salary_max or 0,
        ),
        reverse=True,
    )

    return recommendations[:5], None


def format_salary(job, language):
    if (
        job.salary_min
        and job.salary_max
    ):
        separator = (
            "～"
            if language == "ja"
            else "-"
        )

        return (
            f"¥{job.salary_min:,.0f}"
            f"{separator}"
            f"¥{job.salary_max:,.0f}"
        )

    if job.salary_min:
        if language == "ja":
            return (
                f"¥{job.salary_min:,.0f}～"
            )

        return (
            f"From ¥{job.salary_min:,.0f}"
        )

    if job.salary_max:
        if language == "ja":
            return (
                f"～¥{job.salary_max:,.0f}"
            )

        return (
            f"Up to ¥{job.salary_max:,.0f}"
        )

    if language == "ja":
        return "給与情報なし"

    return "Salary not provided"


def format_job_results(
    jobs,
    language,
):
    if not jobs:
        if language == "ja":
            return (
                "条件に合う求人が"
                "見つかりませんでした。"
                "勤務地、職種、希望給与などの"
                "条件を変更して、"
                "もう一度検索してください。"
            )

        return (
            "I could not find an active job "
            "matching those conditions. "
            "Try changing the location, role "
            "or salary requirement."
        )

    if language == "ja":
        lines = [
            (
                "CareerBridgeでおすすめの"
                "求人を見つけました："
            ),
        ]

        for job in jobs:
            title = (
                job.title_ja
                or job.title_en
            )

            salary = format_salary(
                job,
                language,
            )

            lines.append(
                f"・{title}\n"
                f"  勤務地: {job.location}\n"
                f"  給与: {salary}\n"
                f"  求人ID: {job.id}"
            )

        lines.append(
            "求人一覧ページから詳しい情報を"
            "確認できます。"
        )

        return "\n\n".join(lines)

    lines = [
        (
            "I found these recommended "
            "CareerBridge jobs:"
        ),
    ]

    for job in jobs:
        title = (
            job.title_en
            or job.title_ja
        )

        salary = format_salary(
            job,
            language,
        )

        lines.append(
            f"• {title}\n"
            f"  Location: {job.location}\n"
            f"  Salary: {salary}\n"
            f"  Job ID: {job.id}"
        )

    lines.append(
        "Open the Jobs page to view "
        "details and apply."
    )

    return "\n\n".join(lines)


def format_profile_recommendations(
    recommendations,
    language,
    error_code=None,
):
    if error_code == "profile_missing":
        if language == "ja":
            return (
                "学生プロフィールが"
                "見つかりません。"
                "プロフィールを作成してから、"
                "もう一度お試しください。"
            )

        return (
            "Your student profile was not "
            "found. Please create your "
            "profile first."
        )

    if error_code == "profile_incomplete":
        if language == "ja":
            return (
                "プロフィールのスキル、"
                "希望職種、勤務地を"
                "入力してください。"
            )

        return (
            "Add your skills, preferred role "
            "and location to receive "
            "recommendations."
        )

    if not recommendations:
        if language == "ja":
            return (
                "現在、プロフィールに合う"
                "求人が見つかりませんでした。"
            )

        return (
            "No active jobs currently "
            "match your profile."
        )

    if language == "ja":
        lines = [
            (
                "あなたのプロフィールに基づく"
                "おすすめ求人です："
            ),
        ]

        for item in recommendations:
            job = item["job"]

            title = (
                job.title_ja
                or job.title_en
            )

            salary = format_salary(
                job,
                language,
            )

            skills = "、".join(
                item["matched_skills"]
            )

            reasons = []

            if skills:
                reasons.append(
                    f"一致スキル: {skills}"
                )

            if item["location_matched"]:
                reasons.append(
                    "希望勤務地と一致"
                )

            reason = "、".join(reasons)

            if not reason:
                reason = "希望職種と一致"

            lines.append(
                f"・{title}\n"
                f"  マッチ度: "
                f"{item['match_percentage']}%\n"
                f"  勤務地: {job.location}\n"
                f"  給与: {salary}\n"
                f"  おすすめ理由: {reason}\n"
                f"  求人ID: {job.id}"
            )

        return "\n\n".join(lines)

    lines = [
        (
            "Recommended jobs based on "
            "your profile:"
        ),
    ]

    for item in recommendations:
        job = item["job"]

        title = (
            job.title_en
            or job.title_ja
        )

        salary = format_salary(
            job,
            language,
        )

        skills = ", ".join(
            item["matched_skills"]
        )

        reasons = []

        if skills:
            reasons.append(
                f"Matching skills: {skills}"
            )

        if item["location_matched"]:
            reasons.append(
                "Matches your preferred location"
            )

        reason = "; ".join(reasons)

        if not reason:
            reason = "Matches your preferred role"

        lines.append(
            f"• {title}\n"
            f"  Profile match: "
            f"{item['match_percentage']}%\n"
            f"  Location: {job.location}\n"
            f"  Salary: {salary}\n"
            f"  Why recommended: {reason}\n"
            f"  Job ID: {job.id}"
        )

    return "\n\n".join(lines)


def generate_gemini_response(
    message,
    language,
):
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        return None

    response_language = (
        "Japanese"
        if language == "ja"
        else "English"
    )

    prompt = f"""
You are the AI Career Assistant for CareerBridge.

Answer the user's career-related question in
{response_language}.

Rules:
- Give practical and beginner-friendly advice.
- Focus on careers, resumes, interviews, job searching,
  programming skills and working in Japan.
- Keep the answer concise and easy to understand.
- Use plain text only.
- Do not use Markdown symbols.
- Use short numbered sections and simple line breaks.
- Add one blank line between sections.

User question:
{message}
"""

        try:
        client = genai.Client(
            api_key=api_key,
            http_options=types.HttpOptions(
                timeout=25000,
            ),
        )

        interaction = client.interactions.create(
            model="gemini-3.6-flash",
            input=prompt,
        )

        answer = interaction.output_text

        if answer:
            return answer.strip()

    except Exception as error:
        print(
            f"Gemini request failed: {error}",
            flush=True,
        )

    return None


def generate_career_response(
    message,
    language,
    user,
):
    text = message.lower()

    recommendation_keywords = [
        "recommend",
        "recommended",
        "based on my profile",
        "match my profile",
        "suitable for me",
        "おすすめ",
        "プロフィールに合う",
        "自分に合う",
    ]

    if any(
        keyword in text
        for keyword in recommendation_keywords
    ):
        recommendations, error_code = (
            recommend_jobs_from_profile(
                user,
            )
        )

        return format_profile_recommendations(
            recommendations,
            language,
            error_code,
        )

    job_search_actions = [
        "find",
        "search",
        "show me",
        "looking for",
        "available jobs",
        "求人を探",
        "仕事を探",
        "求人検索",
        "求人を見せ",
    ]

    job_context_keywords = [
        "job",
        "jobs",
        "salary",
        "frontend",
        "backend",
        "developer",
        "engineer",
        "求人",
        "仕事",
        "給与",
        "給料",
        "フロントエンド",
        "バックエンド",
        "エンジニア",
    ]

    has_search_action = any(
        keyword in text
        for keyword in job_search_actions
    )

    has_job_context = any(
        keyword in text
        for keyword in job_context_keywords
    )

    if (
        has_search_action
        and has_job_context
    ):
        jobs = find_matching_jobs(
            message,
        )

        return format_job_results(
            jobs,
            language,
        )

    gemini_answer = (
        generate_gemini_response(
            message,
            language,
        )
    )

    if gemini_answer:
        return gemini_answer

    if language == "ja":
        if (
            "履歴書" in message
            or "resume" in text
        ):
            return (
                "履歴書には、技術スキル、"
                "プロジェクト経験、資格、学歴を"
                "分かりやすく記載しましょう。"
            )

        if (
            "面接" in message
            or "interview" in text
        ):
            return (
                "自己紹介、志望動機、"
                "プロジェクト経験、使用技術について"
                "説明できるように準備しましょう。"
            )

        if (
            "スキル" in message
            or "skill" in text
        ):
            return (
                "React、JavaScript、HTML、CSS、"
                "Git、REST APIを重点的に"
                "学習しましょう。"
            )

        return (
            "履歴書、面接、求人、給与、"
            "勤務地、ITスキルについて"
            "質問してください。"
        )

    if (
        "resume" in text
        or "cv" in text
    ):
        return (
            "Your resume should clearly present "
            "your technical skills, projects, "
            "certifications and education."
        )

    if "interview" in text:
        return (
            "Prepare your self-introduction, "
            "motivation, project experience and "
            "the technologies you used."
        )

    if "skill" in text:
        return (
            "For frontend development, focus on "
            "React, JavaScript, HTML, CSS, Git "
            "and REST API integration."
        )

    return (
        "Ask me about jobs, salary, locations, "
        "resumes, interviews or web-development "
        "skills."
    )


class ChatView(APIView):
    permission_classes = [
        IsAuthenticated,
    ]

    def get(self, request):
        messages = (
            ChatMessage.objects.filter(
                user=request.user,
            )
        )

        serializer = ChatMessageSerializer(
            messages,
            many=True,
        )

        return Response(
            serializer.data,
        )

    def post(self, request):
        request_serializer = (
            ChatRequestSerializer(
                data=request.data,
            )
        )

        request_serializer.is_valid(
            raise_exception=True,
        )

        message = (
            request_serializer
            .validated_data["message"]
        )

        language = (
            request_serializer
            .validated_data["language"]
        )

        ChatMessage.objects.create(
            user=request.user,
            role="user",
            message=message,
            language=language,
        )

        answer = generate_career_response(
            message,
            language,
            request.user,
        )

        assistant_message = (
            ChatMessage.objects.create(
                user=request.user,
                role="assistant",
                message=answer,
                language=language,
            )
        )

        response_serializer = (
            ChatMessageSerializer(
                assistant_message,
            )
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED,
        )


class ClearChatView(APIView):
    permission_classes = [
        IsAuthenticated,
    ]

    def delete(self, request):
        ChatMessage.objects.filter(
            user=request.user,
        ).delete()

        return Response(
            {
                "detail": (
                    "Chat history was cleared."
                ),
            },
            status=status.HTTP_200_OK,
        )