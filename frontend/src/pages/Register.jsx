import { useState } from "react";
import { useTranslation } from "react-i18next";

import api from "../services/api";

const initialForm = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  role: "student",
  preferred_language: "en",
  password: "",
  password_confirm: "",
};

function Register() {
  const { t, i18n } = useTranslation();

  const [form, setForm] = useState({
    ...initialForm,
    preferred_language: i18n.language === "ja" ? "ja" : "en",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await api.post("/auth/register/", form);
      setSuccess(t("registrationSuccess"));
      setForm(initialForm);
    } catch (requestError) {
      const responseData = requestError.response?.data;

      if (responseData) {
        const messages = Object.values(responseData)
          .flat()
          .join(" ");
        setError(messages);
      } else {
        setError(t("serverError"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <a href="/" className="auth-brand">
          <span>CB</span>
          CareerBridge
        </a>

        <h1>{t("createAccount")}</h1>
        <p className="auth-subtitle">{t("registerMessage")}</p>

        {error && <div className="form-message error">{error}</div>}
        {success && <div className="form-message success">{success}</div>}

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>
              {t("firstName")}
              <input
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              {t("lastName")}
              <input
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                required
              />
            </label>
          </div>

          <label>
            {t("username")}
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            {t("email")}
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </label>

          <div className="form-row">
            <label>
              {t("accountType")}
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
              >
                <option value="student">{t("student")}</option>
                <option value="company">{t("company")}</option>
              </select>
            </label>

            <label>
              {t("preferredLanguage")}
              <select
                name="preferred_language"
                value={form.preferred_language}
                onChange={handleChange}
              >
                <option value="en">English</option>
                <option value="ja">日本語</option>
              </select>
            </label>
          </div>

          <label>
            {t("password")}
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            {t("confirmPassword")}
            <input
              type="password"
              name="password_confirm"
              value={form.password_confirm}
              onChange={handleChange}
              required
            />
          </label>

          <button
            className="submit-button"
            type="submit"
            disabled={loading}
          >
            {loading ? t("creating") : t("createAccount")}
          </button>
        </form>

        <a href="/" className="back-link">
          ← {t("backHome")}
        </a>
      </section>
    </main>
  );
}

export default Register;