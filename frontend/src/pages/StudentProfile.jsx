import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
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
            response.data.preferred_workplace ||
            "any",
          japanese_level:
            response.data.japanese_level ||
            "not_required",
          desired_salary_min:
            response.data.desired_salary_min || "",
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
  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setSaving(true);
    const formData = new FormData();
    formData.append(
      "headline",
      profile.headline,
    );
    formData.append(
      "bio",
      profile.bio,
    );
    formData.append(
      "skills",
      profile.skills,
    );
    formData.append(
      "university",
      profile.university,
    );
    formData.append(
      "location",
      profile.location,
    );
    formData.append(
      "graduation_year",
      profile.graduation_year || "",
    );
    formData.append(
      "desired_job_title",
      profile.desired_job_title,
    );
    formData.append(
      "preferred_workplace",
      profile.preferred_workplace,
    );
    formData.append(
      "japanese_level",
      profile.japanese_level,
    );
    formData.append(
      "desired_salary_min",
      profile.desired_salary_min || "",
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
      setProfile((currentProfile) => ({
        ...currentProfile,
        graduation_year:
          response.data.graduation_year || "",
        desired_salary_min:
          response.data.desired_salary_min || "",
      }));
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
      setResumeAnalysis(
        response.data,
      );
      setMessage(
        isJapanese
          ? "履歴書の分析が完了しました。"
          : "Resume analysis was completed.",
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          (isJapanese
            ? "履歴書を分析できませんでした。"
            : "Could not analyze the resume."),
      );
    } finally {
      setAnalyzingResume(false);
    }
  };
  if (loading) {
    return (
      <div className="page-loading">
        {t("loading")}
      </div>
    );
  }
  return (
    <main className="auth-page">
      <section className="auth-card profile-form-card">
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
        <div className="auth-heading">
          <p className="eyebrow">
            {isJapanese
              ? "学生プロフィール"
              : "Student profile"}
          </p>
          <h1>
            {isJapanese
              ? "プロフィール編集"
              : "Edit your profile"}
          </h1>
          <p>
            {isJapanese
              ? "プロフィールと希望条件を入力してください。"
              : "Add your profile and job preferences."}
          </p>
        </div>
        {error && (
          <div className="form-message error">
            {error}
          </div>
        )}
        {message && (
          <div className="form-message success">
            {message}
          </div>
        )}
        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <div className="profile-form-grid">
            <label>
              {isJapanese
                ? "プロフィール見出し"
                : "Professional headline"}
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
            <label>
              {isJapanese
                ? "希望する職種"
                : "Desired job title"}
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
            {isJapanese
              ? "自己紹介"
              : "About you"}
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
          <label>
            {isJapanese
              ? "スキル"
              : "Skills"}
            <input
              type="text"
              name="skills"
              value={profile.skills}
              onChange={handleChange}
              placeholder={
                "React, JavaScript, " +
                "HTML, CSS, Django"
              }
            />
            <small>
              {isJapanese
                ? "スキルをカンマで区切って入力してください。"
                : "Separate skills using commas."}
            </small>
          </label>
          <div className="profile-form-grid">
            <label>
              {isJapanese
                ? "学校・大学"
                : "School or university"}
              <input
                type="text"
                name="university"
                value={profile.university}
                onChange={handleChange}
              />
            </label>
            <label>
              {isJapanese
                ? "卒業予定年"
                : "Graduation year"}
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
          <div className="profile-form-grid">
            <label>
              {isJapanese
                ? "希望勤務地"
                : "Preferred location"}
              <input
                type="text"
                name="location"
                value={profile.location}
                onChange={handleChange}
                placeholder="Osaka, Japan"
              />
            </label>
            <label>
              {isJapanese
                ? "希望する働き方"
                : "Workplace preference"}
              <select
                name="preferred_workplace"
                value={
                  profile.preferred_workplace
                }
                onChange={handleChange}
              >
                <option value="any">
                  {isJapanese
                    ? "指定なし"
                    : "Any"}
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
            <label>
              {isJapanese
                ? "日本語レベル"
                : "Japanese level"}
              <select
                name="japanese_level"
                value={
                  profile.japanese_level
                }
                onChange={handleChange}
              >
                <option value="not_required">
                  {isJapanese
                    ? "未設定"
                    : "Not specified"}
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
            <label>
              {isJapanese
                ? "希望最低給与（月額・円）"
                : "Minimum desired monthly salary"}
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
          <div className="profile-form-grid">
            <label>
              {isJapanese
                ? "プロフィール画像"
                : "Profile image"}
              <input
                type="file"
                accept="image/\*"
                onChange={(event) =>
                  setProfileImage(
                    event.target.files?.[0] ||
                      null,
                  )
                }
              />
            </label>
            <label>
              {isJapanese
                ? "履歴書"
                : "Resume"}
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={(event) =>
                  setResume(
                    event.target.files?.[0] ||
                      null,
                  )
                }
              />
              <small>
                {isJapanese
                  ? "PDFまたはDOCX、最大5MB"
                  : "PDF or DOCX, maximum 5 MB"}
              </small>
            </label>
          </div>
          {(currentImage ||
            currentResume) && (
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
                        ? "現在のプロフィール"
                        : "Current profile"
                    }
                  />
                </div>
              )}
              {currentResume && (
                <a
                  href={currentResume}
                  target="\_blank"
                  rel="noreferrer"
                >
                  {isJapanese
                    ? "現在の履歴書を見る"
                    : "View current resume"}
                </a>
              )}
            </div>
          )}
          {currentResume && (
            <section className="resume-analysis-section">
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
                </div>
                <button
                  className={
                    "secondary-button " +
                    "resume-analyze-button"
                  }
                  type="button"
                  disabled={analyzingResume}
                  onClick={handleAnalyzeResume}
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
                        {
                          resumeAnalysis.overall_score
                        }
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
                      aria-valuenow={resumeScore}
                    >
                      <span
                        style={{
                          width: `${resumeScore}%`,
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
                        resumeAnalysis.analysis
                          .summary
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
                        .length ? (
                        resumeAnalysis.analysis
                          .detected_skills.map(
                            (skill) => (
                              <span
                                className={
                                  "match-skill " +
                                  "matched"
                                }
                                key={skill}
                              >
                                ✓ {skill}
                              </span>
                            ),
                          )
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
                          .strengths.map(
                            (strength) => (
                              <li key={strength}>
                                {strength}
                              </li>
                            ),
                          )}
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
                          .length ? (
                          resumeAnalysis.analysis
                            .recommendations.map(
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
        </form>
      </section>
    </main>
  );
}
export default StudentProfile;
