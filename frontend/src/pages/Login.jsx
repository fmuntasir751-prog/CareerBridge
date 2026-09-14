import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import api from "../services/api";

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
      const response = await api.post("/auth/login/", form);

      localStorage.setItem(
        "careerbridge-access",
        response.data.access,
      );
      localStorage.setItem(
        "careerbridge-refresh",
        response.data.refresh,
      );

      navigate("/dashboard");
    } catch {
      setError(t("invalidCredentials"));
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

        <h1>{t("loginTitle")}</h1>
        <p className="auth-subtitle">{t("loginMessage")}</p>

        {error && (
          <div className="form-message error">{error}</div>
        )}

        <form className="register-form" onSubmit={handleSubmit}>
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
            {t("password")}
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </label>

          <button
            className="submit-button"
            type="submit"
            disabled={loading}
          >
            {loading ? t("loggingIn") : t("login")}
          </button>
        </form>

        <p className="auth-footer">
          {t("noAccount")}{" "}
          <a href="/register">{t("register")}</a>
        </p>

        <a href="/" className="back-link">
          ← {t("backHome")}
        </a>
      </section>
    </main>
  );
}

export default Login;