import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import api from "../services/api";

const emptyProfile = {
  company_name: "",
  description: "",
  website: "",
  location: "",
};

function CompanyProfile() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get("/profiles/company/me/");

        setProfile({
          company_name: response.data.company_name || "",
          description: response.data.description || "",
          website: response.data.website || "",
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

    try {
      await api.patch("/profiles/company/me/", profile);
      setMessage(t("companyProfileSaved"));
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

        <h1>{t("editCompanyProfile")}</h1>
        <p className="auth-subtitle">
          {t("companyProfileMessage")}
        </p>

        {message && (
          <div className="form-message success">{message}</div>
        )}

        {error && (
          <div className="form-message error">{error}</div>
        )}

        <form className="register-form" onSubmit={handleSubmit}>
          <label>
            {t("companyName")}
            <input
              name="company_name"
              value={profile.company_name}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            {t("companyDescription")}
            <textarea
              name="description"
              value={profile.description}
              onChange={handleChange}
              rows="7"
            />
          </label>

          <label>
            {t("website")}
            <input
              type="url"
              name="website"
              value={profile.website}
              onChange={handleChange}
              placeholder="https://example.com"
            />
          </label>

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

export default CompanyProfile;