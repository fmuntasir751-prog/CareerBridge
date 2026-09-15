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
};

function StudentProfile() {
  const { t } = useTranslation();
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
        });

        setCurrentImage(response.data.profile_image || "");
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

    if (profile.graduation_year) {
      formData.append(
        "graduation_year",
        profile.graduation_year,
      );
    }

    if (profileImage) {
      formData.append("profile_image", profileImage);
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

      setCurrentImage(response.data.profile_image || "");
      setCurrentResume(response.data.resume || "");
      setProfileImage(null);
      setResume(null);
      setMessage(t("profileSaved"));
    } catch (requestError) {
      const responseData = requestError.response?.data;

      if (responseData) {
        setError(Object.values(responseData).flat().join(" "));
      } else {
        setError(t("profileSaveError"));
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="page-loading">{t("loading")}</div>;
  }

  return (
    <main className="auth-page">
      <section className="auth-card profile-form-card">
        <button
          className="back-button"
          type="button"
          onClick={() => navigate("/dashboard")}
        >
          ← {t("dashboard")}
        </button>

        <h1>{t("editProfile")}</h1>
        <p className="auth-subtitle">{t("profileMessage")}</p>

        {currentImage && (
          <img
            className="profile-preview"
            src={currentImage}
            alt={t("profileImage")}
          />
        )}

        {message && (
          <div className="form-message success">{message}</div>
        )}

        {error && (
          <div className="form-message error">{error}</div>
        )}

        <form className="register-form" onSubmit={handleSubmit}>
          <label>
            {t("profileImage")}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) =>
                setProfileImage(event.target.files[0] || null)
              }
            />
          </label>

          <label>
            {t("headline")}
            <input
              name="headline"
              value={profile.headline}
              onChange={handleChange}
              placeholder="Frontend Developer"
            />
          </label>

          <label>
            {t("bio")}
            <textarea
              name="bio"
              value={profile.bio}
              onChange={handleChange}
              rows="5"
            />
          </label>

          <label>
            {t("skills")}
            <input
              name="skills"
              value={profile.skills}
              onChange={handleChange}
              placeholder="React, Django, PostgreSQL"
            />
          </label>

          <div className="form-row">
            <label>
              {t("university")}
              <input
                name="university"
                value={profile.university}
                onChange={handleChange}
              />
            </label>

            <label>
              {t("graduationYear")}
              <input
                type="number"
                name="graduation_year"
                value={profile.graduation_year}
                onChange={handleChange}
                min="2020"
                max="2100"
              />
            </label>
          </div>

          <label>
            {t("location")}
            <input
              name="location"
              value={profile.location}
              onChange={handleChange}
            />
          </label>

          <label>
            {t("resume")}
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(event) =>
                setResume(event.target.files[0] || null)
              }
            />
          </label>

          {currentResume && (
            <a
              className="current-file-link"
              href={currentResume}
              target="_blank"
              rel="noreferrer"
            >
              {t("viewCurrentResume")}
            </a>
          )}

          <button
            className="submit-button"
            type="submit"
            disabled={saving}
          >
            {saving ? t("saving") : t("saveProfile")}
          </button>
        </form>
      </section>
    </main>
  );
}

export default StudentProfile;