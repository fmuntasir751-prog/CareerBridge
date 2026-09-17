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

  const [profile, setProfile] = useState(emptyProfile);
  const [profileImage, setProfileImage] = useState(null);
  const [resume, setResume] = useState(null);
  const [currentImage, setCurrentImage] = useState("");
  const [currentResume, setCurrentResume] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isJapanese = i18n.language.startsWith("ja");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get(
          "/profiles/student/me/",
        );

        setProfile({
          headline: response.data.headline || "",
          bio: response.data.bio || "",
          skills: response.data.skills || "",
          university: response.data.university || "",
          graduation_year:
            response.data.graduation_year || "",
          location: response.data.location || "",
          desired_job_title:
            response.data.desired_job_title || "",
          preferred_workplace:
            response.data.preferred_workplace || "any",
          japanese_level:
            response.data.japanese_level ||
            "not_required",
          desired_salary_min:
            response.data.desired_salary_min || "",
        });

        setCurrentImage(
          response.data.profile_image || "",
        );
        setCurrentResume(response.data.resume || "");
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

    formData.append("headline", profile.headline);
    formData.append("bio", profile.bio);
    formData.append("skills", profile.skills);
    formData.append("university", profile.university);
    formData.append("location", profile.location);

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
      formData.append("resume", resume);
    }

    try {
      const response = await api.patch(
        "/profiles/student/me/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
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
      setCurrentResume(response.data.resume || "");

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
          onClick={() => navigate("/dashboard")}
        >
          ← {isJapanese ? "ダッシュボード" : "Dashboard"}
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
                value={profile.desired_job_title}
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
            {isJapanese ? "自己紹介" : "About you"}

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
            {isJapanese ? "スキル" : "Skills"}

            <input
              type="text"
              name="skills"
              value={profile.skills}
              onChange={handleChange}
              placeholder="React, JavaScript, HTML, CSS, Django"
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
                value={profile.graduation_year}
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
                value={profile.preferred_workplace}
                onChange={handleChange}
              >
                <option value="any">
                  {isJapanese ? "指定なし" : "Any"}
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
                value={profile.japanese_level}
                onChange={handleChange}
              >
                <option value="not_required">
                  {isJapanese
                    ? "未設定"
                    : "Not specified"}
                </option>

                <option value="n3">JLPT N3</option>
                <option value="n2">JLPT N2</option>
                <option value="n1">JLPT N1</option>
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
                value={profile.desired_salary_min}
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
                accept="image/*"
                onChange={(event) =>
                  setProfileImage(
                    event.target.files?.[0] || null,
                  )
                }
              />
            </label>

            <label>
              {isJapanese ? "履歴書" : "Resume"}

              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(event) =>
                  setResume(
                    event.target.files?.[0] || null,
                  )
                }
              />
            </label>
          </div>

          {(currentImage || currentResume) && (
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
                    alt=""
                  />
                </div>
              )}

              {currentResume && (
                <a
                  href={currentResume}
                  target="_blank"
                  rel="noreferrer"
                >
                  {isJapanese
                    ? "現在の履歴書を見る"
                    : "View current resume"}
                </a>
              )}
            </div>
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