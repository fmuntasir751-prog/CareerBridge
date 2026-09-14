import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import api from "../services/api";

function ApplyJob() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [coverLetter, setCoverLetter] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    if (!localStorage.getItem("careerbridge-access")) {
      navigate("/login");
      return;
    }

    try {
      await api.post("/applications/", {
        job: Number(id),
        cover_letter: coverLetter,
      });

      setMessage(t("applicationSuccess"));
      setCoverLetter("");
    } catch (requestError) {
      const responseData = requestError.response?.data;

      if (requestError.response?.status === 401) {
        navigate("/login");
      } else if (responseData) {
        setError(Object.values(responseData).flat().join(" "));
      } else {
        setError(t("applicationError"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card profile-form-card">
        <button
          className="back-button"
          type="button"
          onClick={() => navigate(`/jobs/${id}`)}
        >
          ← {t("backToJob")}
        </button>

        <h1>{t("applyForJob")}</h1>
        <p className="auth-subtitle">{t("applicationMessage")}</p>

        {message && (
          <div className="form-message success">{message}</div>
        )}

        {error && (
          <div className="form-message error">{error}</div>
        )}

        <form className="register-form" onSubmit={handleSubmit}>
          <label>
            {t("coverLetter")}
            <textarea
              value={coverLetter}
              onChange={(event) =>
                setCoverLetter(event.target.value)
              }
              rows="10"
              minLength="50"
              required
              placeholder={t("coverLetterPlaceholder")}
            />
          </label>

          <button
            className="submit-button"
            type="submit"
            disabled={loading || Boolean(message)}
          >
            {loading ? t("submitting") : t("submitApplication")}
          </button>
        </form>
      </section>
    </main>
  );
}

export default ApplyJob;