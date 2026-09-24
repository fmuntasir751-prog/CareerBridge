import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  const [form, setForm] = useState({
    ...initialForm,
    preferred_language: i18n.language.startsWith("ja")
      ? "ja"
      : "en",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const getErrorMessage = (requestError) => {
    const responseData = requestError.response?.data;

    if (!responseData) {
      return t("serverError");
    }

    if (typeof responseData === "string") {
      return responseData;
    }

    return Object.values(responseData)
      .flat()
      .join(" ");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post(
        "/auth/register/",
        form,
      );

      navigate("/verify-email", {
        state: {
          email: response.data.email,
        },
      });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
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

        <p className="auth-subtitle">
          {t("registerMessage")}
        </p>

        {error && (
          <div className="form-message error">
            {error}
          </div>
        )}

        <form
          className="register-form"
          onSubmit={handleSubmit}
        >
          <div className="form-row">
            <label>
              {t("firstName")}
              <input
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                autoComplete="given-name"
                required
              />
            </label>

            <label>
              {t("lastName")}
              <input
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                autoComplete="family-name"
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
              autoComplete="username"
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
              autoComplete="email"
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
                <option value="student">
                  {t("student")}
                </option>

                <option value="company">
                  {t("company")}
                </option>
              </select>
            </label>

            <label>
              {t("preferredLanguage")}
              <select
                name="preferred_language"
                value={form.preferred_language}
                onChange={handleChange}
              >
                <option value="en">
                  English
                </option>

                <option value="ja">
                  日本語
                </option>
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
              autoComplete="new-password"
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
              autoComplete="new-password"
              required
            />
          </label>

          <button
            className="submit-button"
            type="submit"
            disabled={loading}
          >
            {loading
              ? t("creating")
              : t("createAccount")}
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