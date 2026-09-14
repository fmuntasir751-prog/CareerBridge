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
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get("/profiles/student/me/");

        setProfile({
          headline: response.data.headline || "",
          bio: response.data.bio || "",
          skills: response.data.skills || "",
          university: response.data.university || "",
          graduation_year: response.data.graduation_year || "",
          location: response.data.location || "",
        });
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

    const data = {
      ...profile,
      graduation_year: profile.graduation_year || null,
    };

    try {
      await api.patch("/profiles/student/me/", data);
      setMessage(t("profileSaved"));
    } catch {
      setError(t("profileSaveError"));
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

        {message && (
          <div className="form-message success">{message}</div>
        )}

        {error && (
          <div className="form-message error">{error}</div>
        )}

        <form className="register-form" onSubmit={handleSubmit}>
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

          <button className="submit-button" type="submit">
            {t("saveProfile")}
          </button>
        </form>
      </section>
    </main>
  );
}

export default StudentProfile;