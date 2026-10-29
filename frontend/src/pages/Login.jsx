import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import api, {
  getApiErrorMessage,
} from "../services/api";

function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isJapanese = i18n.language.startsWith("ja");

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <main className="auth-page auth-split-page">
      <aside className="auth-visual-panel login-visual-panel">
        <Link to="/" className="auth-visual-brand">
          <span>CB</span>
          CareerBridge
        </Link>

        <div className="auth-visual-content">
          <p className="eyebrow">CAREERBRIDGE</p>
          <h2>
            {isJapanese
              ? "次のキャリアチャンスへ。"
              : "Your next opportunity starts here."}
          </h2>
          <p>
            {isJapanese
              ? "AIマッチング、認証済み企業、日英対応のキャリア支援をひとつの場所で。"
              : "AI matching, verified employers and bilingual career support—all in one place."}
          </p>

          <div className="auth-benefit-list">
            <span>✓ {isJapanese ? "AI求人マッチング" : "AI-powered job matching"}</span>
            <span>✓ {isJapanese ? "認証済み企業" : "Verified companies"}</span>
            <span>✓ {isJapanese ? "安全な応募管理" : "Secure application tracking"}</span>
          </div>
        </div>

        <div className="auth-visual-stat">
          <strong>92%</strong>
          <span>{isJapanese ? "マッチ度の例" : "Sample match score"}</span>
        </div>
      </aside>

      <section className="auth-form-panel">
        <section className="auth-card auth-card-modern">
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

          <label className="password-field-label">
            {t("password")}
            <span className="password-input-wrap">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </span>
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
      </section>
    </main>
  );
}

export default Login;
