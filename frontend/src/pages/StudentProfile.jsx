import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "../components/DashboardHeader";

import api from "../services/api";

const MAX_RESUME_SIZE = 5 * 1024 * 1024;

const emptyProfile = {
  headline: "",
  bio: "",
  skills: "",
  university: "",
  graduation_year: "",
  location: "",
  desired_job_title: "",
  preferred_workplace: "any",
  japanese_level: "not_required",
  desired_salary_min: "",
};

const matchingFieldKeys = [
  "skills",
  "location",
  "desired_job_title",
  "preferred_workplace",
  "japanese_level",
  "desired_salary_min",
];

function getMissingMatchingFields(profile) {
  return matchingFieldKeys.filter((field) => {
    const value = profile[field];

    if (
      field === "preferred_workplace"
      && value === "any"
    ) {
      return true;
    }

    if (
      field === "japanese_level"
      && value === "not_required"
    ) {
      return true;
    }

    return (
      value === null
      || value === undefined
      || String(value).trim() === ""
    );
  });
}

function StudentProfile() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [profile, setProfile] =
    useState(emptyProfile);

  const [profileImage, setProfileImage] =
    useState(null);

  const [resume, setResume] =
    useState(null);

  const [currentImage, setCurrentImage] =
    useState("");

  const [currentResume, setCurrentResume] =
    useState("");

  const [
    resumeAnalysis,
    setResumeAnalysis,
  ] = useState(null);

  const [
    analyzingResume,
    setAnalyzingResume,
  ] = useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const isJapanese =
    i18n.language.startsWith("ja");

  const missingMatchingFields = useMemo(
    () => getMissingMatchingFields(profile),
    [profile],
  );

  const matchingCompletion = Math.round(
    (
      (
        matchingFieldKeys.length
        - missingMatchingFields.length
      )
      / matchingFieldKeys.length
    )
    * 100,
  );

  const matchingReady =
    missingMatchingFields.length === 0;

  const resumeScore =
    resumeAnalysis?.overall_score ?? 0;

  const resumeScoreLabel =
    resumeScore >= 85
      ? isJapanese
        ? "非常に良い"
        : "Excellent"
      : resumeScore >= 70
        ? isJapanese
          ? "良い"
          : "Good"
        : resumeScore >= 50
          ? isJapanese
            ? "改善中"
            : "Developing"
          : isJapanese
            ? "改善が必要"
            : "Needs improvement";

  const missingFieldLabels = {
    skills: isJapanese
      ? "スキル"
      : "Skills",
    location: isJapanese
      ? "希望勤務地"
      : "Preferred location",
    desired_job_title: isJapanese
      ? "希望職種"
      : "Desired job title",
    preferred_workplace: isJapanese
      ? "希望する働き方"
      : "Workplace preference",
    japanese_level: isJapanese
      ? "日本語レベル"
      : "Japanese level",
    desired_salary_min: isJapanese
      ? "希望給与"
      : "Desired salary",
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get(
          "/profiles/student/me/",
        );

        setProfile({
          headline:
            response.data.headline || "",
          bio:
            response.data.bio || "",
          skills:
            response.data.skills || "",
          university:
            response.data.university || "",
          graduation_year:
            response.data.graduation_year || "",
          location:
            response.data.location || "",
          desired_job_title:
            response.data.desired_job_title || "",
          preferred_workplace:
            response.data.preferred_workplace
            || "any",
          japanese_level:
            response.data.japanese_level
            || "not_required",
          desired_salary_min:
            response.data.desired_salary_min
            || "",
        });

        setCurrentImage(
          response.data.profile_image || "",
        );

        setCurrentResume(
          response.data.resume || "",
        );
      } catch {
        setError(t("profileLoadError"));
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [t]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setProfile((currentProfile) => ({
      ...currentProfile,
      [name]: value,
    }));
  };

  const handleResumeChange = (event) => {
    const file =
      event.target.files?.[0] || null;

    if (file && file.size > MAX_RESUME_SIZE) {
      setMessage("");

      setError(
        isJapanese
          ? "ファイルは5MB以下にしてください。"
          : "File must be 5 MB or smaller.",
      );

      event.target.value = "";
      setResume(null);

      return;
    }

    setError("");
    setResume(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");
    setSaving(true);

    const formData = new FormData();

    Object.entries(profile).forEach(
      ([key, value]) => {
        formData.append(
          key,
          value ?? "",
        );
      },
    );

    if (profileImage) {
      formData.append(
        "profile_image",
        profileImage,
      );
    }

    if (resume) {
      formData.append(
        "resume",
        resume,
      );
    }

    try {
      const response = await api.patch(
        "/profiles/student/me/",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        },
      );

      setProfile({
        headline:
          response.data.headline || "",
        bio:
          response.data.bio || "",
        skills:
          response.data.skills || "",
        university:
          response.data.university || "",
        graduation_year:
          response.data.graduation_year || "",
        location:
          response.data.location || "",
        desired_job_title:
          response.data.desired_job_title || "",
        preferred_workplace:
          response.data.preferred_workplace
          || "any",
        japanese_level:
          response.data.japanese_level
          || "not_required",
        desired_salary_min:
          response.data.desired_salary_min
          || "",
      });

      setCurrentImage(
        response.data.profile_image || "",
      );

      setCurrentResume(
        response.data.resume || "",
      );

      if (resume) {
        setResumeAnalysis(null);
      }

      setProfileImage(null);
      setResume(null);
      setMessage(t("profileSaved"));

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (requestError) {
      const responseData =
        requestError.response?.data;

      if (responseData) {
        setError(
          Object.values(responseData)
            .flat()
            .join(" "),
        );
      } else {
        setError(t("profileSaveError"));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyzeResume = async () => {
    if (!currentResume) {
      setError(
        isJapanese
          ? "先に履歴書をアップロードして保存してください。"
          : "Upload and save your resume first.",
      );

      return;
    }

    setError("");
    setMessage("");
    setAnalyzingResume(true);

    try {
      const response = await api.post(
        "/profiles/student/resume/analysis/",
        {
          language:
            isJapanese ? "ja" : "en",
        },
      );

      setResumeAnalysis(response.data);

      setMessage(
        isJapanese
          ? "履歴書の分析が完了しました。"
          : "Resume analysis was completed.",
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail
        || (
          isJapanese
            ? "履歴書を分析できませんでした。"
            : "Could not analyze the resume."
        ),
      );
    } finally {
      setAnalyzingResume(false);
    }
  };

  if (loading) {
    return (
      <div
        className="page-loading"
        role="status"
      >
        {t("loading")}
      </div>
    );
  }

  return (
    <main className="student-profile-page">
      <DashboardHeader role="student" />

      <section className="student-profile-layout">
        <aside className="student-profile-sidebar">
          <button
            className="back-button"
            type="button"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            ←{" "}
            {isJapanese
              ? "ダッシュボード"
              : "Dashboard"}
          </button>

          <div className="profile-sidebar-summary">
            <div className="profile-avatar-preview">
              {currentImage ? (
                <img
                  src={currentImage}
                  alt={
                    isJapanese
                      ? "プロフィール画像"
                      : "Profile"
                  }
                />
              ) : (
                <span aria-hidden="true">
                  {profile.headline
                    ?.charAt(0)
                    ?.toUpperCase() || "S"}
                </span>
              )}
            </div>

            <p className="eyebrow">
              {isJapanese
                ? "学生プロフィール"
                : "Student profile"}
            </p>

            <h2>
              {profile.headline
                || (
                  isJapanese
                    ? "プロフィールを編集"
                    : "Build your profile"
                )}
            </h2>

            <p>
              {isJapanese
                ? "入力した情報は求人マッチングに使用されます。"
                : "Your information is used to calculate job matches."}
            </p>
          </div>

          <div
            className={
              `profile-readiness-card ${
                matchingReady
                  ? "complete"
                  : "incomplete"
              }`
            }
          >
            <div className="profile-readiness-heading">
              <div>
                <small>
                  {isJapanese
                    ? "マッチング準備度"
                    : "Matching readiness"}
                </small>

                <strong>
                  {matchingCompletion}%
                </strong>
              </div>

              <span aria-hidden="true">
                {matchingReady ? "✓" : "!"}
              </span>
            </div>

            <div
              className="profile-readiness-progress"
              role="progressbar"
              aria-label={
                isJapanese
                  ? "マッチング準備度"
                  : "Matching readiness"
              }
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={
                matchingCompletion
              }
            >
              <span
                style={{
                  width:
                    `${matchingCompletion}%`,
                }}
              />
            </div>

            {matchingReady ? (
              <p>
                {isJapanese
                  ? "求人マッチングの準備ができました。"
                  : "Your profile is ready for job matching."}
              </p>
            ) : (
              <>
                <p>
                  {isJapanese
                    ? "次の項目を追加してください："
                    : "Complete these fields:"}
                </p>

                <ul>
                  {missingMatchingFields.map(
                    (field) => (
                      <li key={field}>
                        {
                          missingFieldLabels[
                            field
                          ]
                        }
                      </li>
                    ),
                  )}
                </ul>
              </>
            )}
          </div>

          <nav
            className="profile-section-navigation"
            aria-label={
              isJapanese
                ? "プロフィールセクション"
                : "Profile sections"
            }
          >
            <a href="#professional">
              {isJapanese
                ? "基本情報"
                : "Professional profile"}
            </a>

            <a href="#education">
              {isJapanese
                ? "学歴"
                : "Education"}
            </a>

            <a href="#preferences">
              {isJapanese
                ? "希望条件"
                : "Job preferences"}
            </a>

            <a href="#documents">
              {isJapanese
                ? "書類"
                : "Documents"}
            </a>

            {currentResume && (
              <a href="#resume-analysis">
                {isJapanese
                  ? "AI履歴書分析"
                  : "AI resume analysis"}
              </a>
            )}
          </nav>
        </aside>

        <section className="student-profile-main">
          <div className="student-profile-title">
            <p className="eyebrow">
              {isJapanese
                ? "プロフィール設定"
                : "Profile settings"}
            </p>

            <h1>
              {isJapanese
                ? "プロフィール編集"
                : "Edit your profile"}
            </h1>

            <p>
              {isJapanese
                ? "正確な求人推薦のために、スキルと希望条件を入力してください。"
                : "Add your skills and preferences to receive accurate job recommendations."}
            </p>
          </div>

          {error && (
            <div
              className="form-message error"
              role="alert"
            >
              {error}
            </div>
          )}

          {message && (
            <div
              className="form-message success"
              role="status"
            >
              {message}
            </div>
          )}

          <form
            className="profile-settings-form"
            onSubmit={handleSubmit}
          >
            <section
              className="profile-form-section"
              id="professional"
            >
              <div className="profile-form-section-heading">
                <span aria-hidden="true">
                  01
                </span>

                <div>
                  <h2>
                    {isJapanese
                      ? "基本情報"
                      : "Professional profile"}
                  </h2>

                  <p>
                    {isJapanese
                      ? "採用担当者に表示する情報です。"
                      : "Tell employers about your career goals and abilities."}
                  </p>
                </div>
              </div>

              <div className="profile-form-grid">
                <label>
                  <span className="profile-field-label">
                    {isJapanese
                      ? "プロフィール見出し"
                      : "Professional headline"}
                  </span>

                  <input
                    type="text"
                    name="headline"
                    value={profile.headline}
                    onChange={handleChange}
                    placeholder={
                      isJapanese
                        ? "例：フロントエンド開発者を目指す学生"
                        : "e.g. Aspiring frontend developer"
                    }
                  />
                </label>

                <label
                  className={
                    missingMatchingFields.includes(
                      "desired_job_title",
                    )
                      ? "profile-field-missing"
                      : ""
                  }
                >
                  <span className="profile-field-label">
                    {isJapanese
                      ? "希望する職種"
                      : "Desired job title"}

                    <em>
                      {isJapanese
                        ? "マッチング必須"
                        : "Required for matching"}
                    </em>
                  </span>

                  <input
                    type="text"
                    name="desired_job_title"
                    value={
                      profile.desired_job_title
                    }
                    onChange={handleChange}
                    placeholder={
                      isJapanese
                        ? "例：フロントエンドエンジニア"
                        : "e.g. Frontend developer"
                    }
                  />
                </label>
              </div>

              <label>
                <span className="profile-field-label">
                  {isJapanese
                    ? "自己紹介"
                    : "About you"}
                </span>

                <textarea
                  name="bio"
                  value={profile.bio}
                  onChange={handleChange}
                  rows="5"
                  placeholder={
                    isJapanese
                      ? "経験、目標、興味について入力してください。"
                      : "Describe your experience, goals and interests."
                  }
                />
              </label>

              <label
                className={
                  missingMatchingFields.includes(
                    "skills",
                  )
                    ? "profile-field-missing"
                    : ""
                }
              >
                <span className="profile-field-label">
                  {isJapanese
                    ? "スキル"
                    : "Skills"}

                  <em>
                    {isJapanese
                      ? "マッチング必須"
                      : "Required for matching"}
                  </em>
                </span>

                <input
                  type="text"
                  name="skills"
                  value={profile.skills}
                  onChange={handleChange}
                  placeholder={
                    "React, JavaScript, "
                    + "HTML, CSS, Django"
                  }
                />

                <small>
                  {isJapanese
                    ? "スキルをカンマで区切って入力してください。"
                    : "Separate skills using commas."}
                </small>
              </label>
            </section>

            <section
              className="profile-form-section"
              id="education"
            >
              <div className="profile-form-section-heading">
                <span aria-hidden="true">
                  02
                </span>

                <div>
                  <h2>
                    {isJapanese
                      ? "学歴"
                      : "Education"}
                  </h2>

                  <p>
                    {isJapanese
                      ? "現在の学校と卒業予定年を入力してください。"
                      : "Add your current school and expected graduation year."}
                  </p>
                </div>
              </div>

              <div className="profile-form-grid">
                <label>
                  <span className="profile-field-label">
                    {isJapanese
                      ? "学校・大学"
                      : "School or university"}
                  </span>

                  <input
                    type="text"
                    name="university"
                    value={profile.university}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  <span className="profile-field-label">
                    {isJapanese
                      ? "卒業予定年"
                      : "Graduation year"}
                  </span>

                  <input
                    type="number"
                    name="graduation_year"
                    min="2020"
                    max="2100"
                    value={
                      profile.graduation_year
                    }
                    onChange={handleChange}
                  />
                </label>
              </div>
            </section>

            <section
              className="profile-form-section"
              id="preferences"
            >
              <div className="profile-form-section-heading">
                <span aria-hidden="true">
                  03
                </span>

                <div>
                  <h2>
                    {isJapanese
                      ? "希望条件"
                      : "Job preferences"}
                  </h2>

                  <p>
                    {isJapanese
                      ? "求人マッチングに使用する条件です。"
                      : "These preferences directly affect your match scores."}
                  </p>
                </div>
              </div>

              <div className="profile-form-grid">
                <label
                  className={
                    missingMatchingFields.includes(
                      "location",
                    )
                      ? "profile-field-missing"
                      : ""
                  }
                >
                  <span className="profile-field-label">
                    {isJapanese
                      ? "希望勤務地"
                      : "Preferred location"}

                    <em>
                      {isJapanese
                        ? "マッチング必須"
                        : "Required for matching"}
                    </em>
                  </span>

                  <input
                    type="text"
                    name="location"
                    value={profile.location}
                    onChange={handleChange}
                    placeholder="Osaka, Japan"
                  />
                </label>

                <label
                  className={
                    missingMatchingFields.includes(
                      "preferred_workplace",
                    )
                      ? "profile-field-missing"
                      : ""
                  }
                >
                  <span className="profile-field-label">
                    {isJapanese
                      ? "希望する働き方"
                      : "Workplace preference"}

                    <em>
                      {isJapanese
                        ? "マッチング必須"
                        : "Required for matching"}
                    </em>
                  </span>

                  <select
                    name="preferred_workplace"
                    value={
                      profile.preferred_workplace
                    }
                    onChange={handleChange}
                  >
                    <option value="any">
                      {isJapanese
                        ? "選択してください"
                        : "Select a preference"}
                    </option>

                    <option value="onsite">
                      {isJapanese
                        ? "オフィス勤務"
                        : "On-site"}
                    </option>

                    <option value="remote">
                      {isJapanese
                        ? "リモート"
                        : "Remote"}
                    </option>

                    <option value="hybrid">
                      {isJapanese
                        ? "ハイブリッド"
                        : "Hybrid"}
                    </option>
                  </select>
                </label>
              </div>

              <div className="profile-form-grid">
                <label
                  className={
                    missingMatchingFields.includes(
                      "japanese_level",
                    )
                      ? "profile-field-missing"
                      : ""
                  }
                >
                  <span className="profile-field-label">
                    {isJapanese
                      ? "日本語レベル"
                      : "Japanese level"}

                    <em>
                      {isJapanese
                        ? "マッチング必須"
                        : "Required for matching"}
                    </em>
                  </span>

                  <select
                    name="japanese_level"
                    value={
                      profile.japanese_level
                    }
                    onChange={handleChange}
                  >
                    <option value="not_required">
                      {isJapanese
                        ? "選択してください"
                        : "Select your level"}
                    </option>

                    <option value="n3">
                      JLPT N3
                    </option>

                    <option value="n2">
                      JLPT N2
                    </option>

                    <option value="n1">
                      JLPT N1
                    </option>
                  </select>
                </label>

                <label
                  className={
                    missingMatchingFields.includes(
                      "desired_salary_min",
                    )
                      ? "profile-field-missing"
                      : ""
                  }
                >
                  <span className="profile-field-label">
                    {isJapanese
                      ? "希望最低給与（月額・円）"
                      : "Minimum monthly salary"}

                    <em>
                      {isJapanese
                        ? "マッチング必須"
                        : "Required for matching"}
                    </em>
                  </span>

                  <input
                    type="number"
                    name="desired_salary_min"
                    min="0"
                    step="10000"
                    value={
                      profile.desired_salary_min
                    }
                    onChange={handleChange}
                    placeholder="250000"
                  />
                </label>
              </div>
            </section>

            <section
              className="profile-form-section"
              id="documents"
            >
              <div className="profile-form-section-heading">
                <span aria-hidden="true">
                  04
                </span>

                <div>
                  <h2>
                    {isJapanese
                      ? "画像と履歴書"
                      : "Profile image and resume"}
                  </h2>

                  <p>
                    {isJapanese
                      ? "採用担当者に表示する画像と履歴書を追加できます。"
                      : "Upload a professional image and your current resume."}
                  </p>
                </div>
              </div>

              <div className="profile-upload-grid">
                <label className="profile-upload-card">
                  <strong>
                    {isJapanese
                      ? "プロフィール画像"
                      : "Profile image"}
                  </strong>

                  <span>
                    {isJapanese
                      ? "JPG、PNG、WEBP"
                      : "JPG, PNG or WEBP"}
                  </span>

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) =>
                      setProfileImage(
                        event.target.files?.[0]
                        || null,
                      )
                    }
                  />

                  {profileImage && (
                    <small>
                      {profileImage.name}
                    </small>
                  )}
                </label>

                <label className="profile-upload-card">
                  <strong>
                    {isJapanese
                      ? "履歴書"
                      : "Resume"}
                  </strong>

                  <span>
                    {isJapanese
                      ? "PDFまたはDOCX、最大5MB"
                      : "PDF or DOCX, maximum 5 MB"}
                  </span>

                  <input
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleResumeChange}
                  />

                  {resume && (
                    <small>{resume.name}</small>
                  )}
                </label>
              </div>

              {(currentImage
                || currentResume) && (
                <div className="current-profile-files">
                  {currentImage && (
                    <div>
                      <span>
                        {isJapanese
                          ? "現在の画像"
                          : "Current image"}
                      </span>

                      <img
                        src={currentImage}
                        alt={
                          isJapanese
                            ? "現在のプロフィール画像"
                            : "Current profile"
                        }
                      />
                    </div>
                  )}

                  {currentResume && (
                    <a
                      href={currentResume}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {isJapanese
                        ? "現在の履歴書を見る"
                        : "View current resume"}
                      <span aria-hidden="true">
                        ↗
                      </span>
                    </a>
                  )}
                </div>
              )}
            </section>

            {currentResume && (
              <section
                className="resume-analysis-section"
                id="resume-analysis"
              >
                <div className="resume-analysis-intro">
                  <div>
                    <p className="eyebrow">
                      {isJapanese
                        ? "AI履歴書分析"
                        : "AI Resume Analysis"}
                    </p>

                    <h2>
                      {isJapanese
                        ? "履歴書を改善する"
                        : "Improve your resume"}
                    </h2>

                    <p>
                      {isJapanese
                        ? "AIがスキル、構成、経験を分析し、改善点を提案します。"
                        : "AI reviews your skills, structure and experience and suggests improvements."}
                    </p>

                    {resume && (
                      <small className="resume-analysis-note">
                        {isJapanese
                          ? "新しい履歴書を分析するには、先に保存してください。"
                          : "Save first to analyze a new resume."}
                      </small>
                    )}
                  </div>

                  <button
                    className={
                      "secondary-button "
                      + "resume-analyze-button"
                    }
                    type="button"
                    disabled={analyzingResume}
                    onClick={
                      handleAnalyzeResume
                    }
                  >
                    {analyzingResume && (
                      <span
                        className="button-spinner"
                        aria-hidden="true"
                      />
                    )}

                    <span>
                      {analyzingResume
                        ? isJapanese
                          ? "履歴書を分析しています..."
                          : "Analyzing your resume..."
                        : isJapanese
                          ? "履歴書を分析"
                          : "Analyze my resume"}
                    </span>
                  </button>
                </div>

                {resumeAnalysis?.analysis && (
                  <div className="resume-analysis-result">
                    <div className="resume-score-card">
                      <div className="resume-score">
                        <strong>
                          {resumeScore}
                        </strong>
                        <span>/100</span>
                      </div>

                      <strong className="resume-score-label">
                        {resumeScoreLabel}
                      </strong>

                      <div
                        className="resume-score-progress"
                        role="progressbar"
                        aria-label={
                          isJapanese
                            ? "履歴書スコア"
                            : "Resume score"
                        }
                        aria-valuemin="0"
                        aria-valuemax="100"
                        aria-valuenow={
                          resumeScore
                        }
                      >
                        <span
                          style={{
                            width:
                              `${resumeScore}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="resume-analysis-summary">
                      <h3>
                        {isJapanese
                          ? "分析結果"
                          : "Analysis result"}
                      </h3>

                      <p>
                        {
                          resumeAnalysis
                            .analysis.summary
                        }
                      </p>

                      <span className="analysis-source">
                        {resumeAnalysis.analysis
                          .ai_generated
                          ? isJapanese
                            ? "Gemini AIによる分析"
                            : "Analyzed with Gemini AI"
                          : isJapanese
                            ? "CareerBridgeによる履歴書評価"
                            : "CareerBridge Resume Review"}
                      </span>
                    </div>

                    <div className="resume-analysis-column">
                      <h3>
                        {isJapanese
                          ? "検出されたスキル"
                          : "Detected skills"}
                      </h3>

                      <div className="match-skill-list">
                        {resumeAnalysis.analysis
                          .detected_skills
                          ?.length ? (
                            resumeAnalysis.analysis
                              .detected_skills
                              .map((skill) => (
                                <span
                                  className={
                                    "match-skill "
                                    + "matched"
                                  }
                                  key={skill}
                                >
                                  ✓ {skill}
                                </span>
                              ))
                          ) : (
                            <span className="match-empty">
                              {isJapanese
                                ? "スキルが見つかりませんでした"
                                : "No skills were detected"}
                            </span>
                          )}
                      </div>
                    </div>

                    <div className="resume-analysis-grid">
                      <div>
                        <h3>
                          {isJapanese
                            ? "強み"
                            : "Strengths"}
                        </h3>

                        <ul>
                          {resumeAnalysis.analysis
                            .strengths
                            ?.map((strength) => (
                              <li key={strength}>
                                {strength}
                              </li>
                            ))}
                        </ul>
                      </div>

                      <div>
                        <h3>
                          {isJapanese
                            ? "改善提案"
                            : "Recommendations"}
                        </h3>

                        <ul>
                          {resumeAnalysis.analysis
                            .recommendations
                            ?.length ? (
                              resumeAnalysis.analysis
                                .recommendations
                                .map(
                                  (
                                    recommendation,
                                  ) => (
                                    <li
                                      key={
                                        recommendation
                                      }
                                    >
                                      {
                                        recommendation
                                      }
                                    </li>
                                  ),
                                )
                            ) : (
                              <li>
                                {isJapanese
                                  ? "大きな改善点はありません。"
                                  : "No major improvements are required."}
                              </li>
                            )}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            <div className="profile-save-bar">
              <div>
                <strong>
                  {matchingReady
                    ? isJapanese
                      ? "マッチング準備完了"
                      : "Ready for matching"
                    : isJapanese
                      ? "未入力項目があります"
                      : "Profile needs information"}
                </strong>

                <small>
                  {isJapanese
                    ? "変更を保存してダッシュボードに反映します。"
                    : "Save your changes to update job recommendations."}
                </small>
              </div>

              <button
                className="submit-button"
                type="submit"
                disabled={saving}
              >
                {saving
                  ? isJapanese
                    ? "保存中..."
                    : "Saving..."
                  : isJapanese
                    ? "プロフィールを保存"
                    : "Save profile"}
              </button>
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}

export default StudentProfile;
