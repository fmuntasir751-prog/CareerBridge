import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import api, {
  getApiErrorMessage,
} from "../services/api";

function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post(
        "/auth/login/",
        form,
      );

      localStorage.setItem(
        "careerbridge-access",
        response.data.access,
      );

      localStorage.setItem(
        "careerbridge-refresh",
        response.data.refresh,
      );

      navigate("/dashboard");
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          t("invalidCredentials"),
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link to="/" className="auth-brand">
          <span>CB</span>
          CareerBridge
        </Link>

        <h1>{t("loginTitle")}</h1>

        <p className="auth-subtitle">
          {t("loginMessage")}
        </p>

        {error && (
          <div
            className="form-message error"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        )}

        <form
          className="register-form"
          onSubmit={handleSubmit}
          aria-busy={loading}
        >
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
            {t("password")}
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
          </label>

          <Link
            to="/forgot-password"
            className="forgot-password-link"
          >
            {t("forgotPassword")}
          </Link>

          <button
            className="submit-button"
            type="submit"
            disabled={loading}
          >
            {loading
              ? t("loggingIn")
              : t("login")}
          </button>
        </form>

        <p className="auth-footer">
          {t("noAccount")}{" "}
          <Link to="/register">
            {t("register")}
          </Link>
        </p>

        <Link to="/" className="back-link">
          ← {t("backHome")}
        </Link>
      </section>
    </main>
  );
}

export default Login;