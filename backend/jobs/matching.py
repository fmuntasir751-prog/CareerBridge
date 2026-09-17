import re


SKILL_ALIASES = {
    "React": ["react", "react.js", "reactjs"],
    "JavaScript": ["javascript", "js", "es6"],
    "TypeScript": ["typescript", "ts"],
    "HTML": ["html", "html5"],
    "CSS": ["css", "css3"],
    "Python": ["python"],
    "Django": ["django", "django rest framework", "drf"],
    "REST API": ["rest api", "restful api", "api"],
    "PostgreSQL": ["postgresql", "postgres"],
    "MySQL": ["mysql"],
    "Git": ["git", "github"],
    "Docker": ["docker"],
    "Node.js": ["node.js", "nodejs"],
    "Vue": ["vue", "vue.js", "vuejs"],
    "Angular": ["angular"],
    "Next.js": ["next.js", "nextjs"],
    "Tailwind CSS": ["tailwind", "tailwind css"],
    "Bootstrap": ["bootstrap"],
    "AWS": ["aws", "amazon web services"],
    "Figma": ["figma"],
    "Java": ["java"],
    "C++": ["c++"],
}


JAPANESE_LEVEL_RANK = {
    "not_required": 0,
    "n3": 1,
    "n2": 2,
    "n1": 3,
}


def normalize_text(value):
    return re.sub(
        r"\s+",
        " ",
        str(value or "").strip().lower(),
    )


def contains_term(text, term):
    pattern = (
        r"(?<![a-zA-Z0-9])"
        + re.escape(term.lower())
        + r"(?![a-zA-Z0-9])"
    )

    return re.search(pattern, text) is not None


def canonicalize_profile_skills(skills_text):
    raw_skills = [
        normalize_text(skill)
        for skill in str(skills_text or "").split(",")
        if normalize_text(skill)
    ]

    canonical_skills = set()

    for raw_skill in raw_skills:
        matched = False

        for canonical_name, aliases in SKILL_ALIASES.items():
            if any(
                raw_skill == normalize_text(alias)
                for alias in aliases
            ):
                canonical_skills.add(canonical_name)
                matched = True
                break

        if not matched:
            canonical_skills.add(raw_skill.title())

    return canonical_skills


def extract_job_skills(job):
    job_text = normalize_text(
        " ".join(
            [
                job.title_en,
                job.title_ja,
                job.description_en,
                job.description_ja,
                job.requirements,
            ]
        )
    )

    required_skills = set()

    for canonical_name, aliases in SKILL_ALIASES.items():
        if any(
            contains_term(job_text, normalize_text(alias))
            for alias in aliases
        ):
            required_skills.add(canonical_name)

    return required_skills


def calculate_title_score(profile, job):
    desired_title = normalize_text(
        profile.desired_job_title,
    )

    if not desired_title:
        return 0

    job_title = normalize_text(
        f"{job.title_en} {job.title_ja}",
    )

    desired_words = {
        word
        for word in re.findall(
            r"[a-zA-Z0-9+#.]+",
            desired_title,
        )
        if len(word) > 2
    }

    job_words = set(
        re.findall(
            r"[a-zA-Z0-9+#.]+",
            job_title,
        )
    )

    if not desired_words:
        return 0

    matched_words = desired_words & job_words

    return round(
        len(matched_words) / len(desired_words) * 15
    )


def calculate_job_match(profile, job):
    profile_skills = canonicalize_profile_skills(
        profile.skills,
    )

    required_skills = extract_job_skills(job)

    matching_skills = sorted(
        profile_skills & required_skills,
    )

    missing_skills = sorted(
        required_skills - profile_skills,
    )

    if required_skills:
        skills_score = round(
            len(matching_skills)
            / len(required_skills)
            * 40
        )
    else:
        skills_score = 20

    title_score = calculate_title_score(
        profile,
        job,
    )

    profile_location = normalize_text(profile.location)
    job_location = normalize_text(job.location)

    location_match = bool(
        profile_location
        and (
            profile_location in job_location
            or job_location in profile_location
            or profile_location.split(",")[0]
            in job_location
        )
    )

    location_score = 15 if location_match else 0

    workplace_match = (
        profile.preferred_workplace == "any"
        or profile.preferred_workplace
        == job.workplace_type
    )

    workplace_score = 10 if workplace_match else 0

    student_japanese_rank = JAPANESE_LEVEL_RANK.get(
        profile.japanese_level,
        0,
    )

    required_japanese_rank = JAPANESE_LEVEL_RANK.get(
        job.japanese_level,
        0,
    )

    japanese_match = (
        student_japanese_rank
        >= required_japanese_rank
    )

    japanese_score = 10 if japanese_match else 0

    desired_salary = profile.desired_salary_min

    if not desired_salary:
        salary_match = None
        salary_score = 0
    elif job.salary_max is None:
        salary_match = None
        salary_score = 5
    else:
        salary_match = (
            job.salary_max >= desired_salary
        )
        salary_score = 10 if salary_match else 0

    total_score = min(
        100,
        skills_score
        + title_score
        + location_score
        + workplace_score
        + japanese_score
        + salary_score,
    )

    if total_score >= 80:
        readiness = "excellent"
    elif total_score >= 65:
        readiness = "good"
    elif total_score >= 45:
        readiness = "developing"
    else:
        readiness = "low"

    recommendations = []

    if missing_skills:
        recommendations.append("improve_missing_skills")

    if not location_match:
        recommendations.append("review_location")

    if not workplace_match:
        recommendations.append("review_workplace")

    if not japanese_match:
        recommendations.append("improve_japanese")

    if salary_match is False:
        recommendations.append("review_salary")

    if not profile.resume:
        recommendations.append("upload_resume")

    return {
        "match_score": total_score,
        "readiness": readiness,
        "matching_skills": matching_skills,
        "missing_skills": missing_skills,
        "required_skills": sorted(required_skills),
        "matches": {
            "location": location_match,
            "workplace": workplace_match,
            "japanese_level": japanese_match,
            "salary": salary_match,
        },
        "score_breakdown": {
            "skills": skills_score,
            "job_title": title_score,
            "location": location_score,
            "workplace": workplace_score,
            "japanese_level": japanese_score,
            "salary": salary_score,
        },
        "recommendations": recommendations,
    }