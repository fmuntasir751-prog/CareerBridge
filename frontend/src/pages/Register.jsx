import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import api, {
  getApiErrorMessage,
} from "../services/api";

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
  const isJapanese = i18n.language.startsWith("ja");

  const passwordStrength = [
    form.password.length >= 8,
    /[A-Z]/.test(form.password),
    /[0-9]/.test(form.password),
    /[^A-Za-z0-9]/.test(form.password),
  ].filter(Boolean).length;

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

    if (form.password.length < 8) {
      setError(t("passwordTooShort"));
      return;
    }

    if (form.password !== form.password_confirm) {
      setError(t("passwordsDoNotMatch"));
      return;
    }

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
      setError(
        getApiErrorMessage(
          requestError,
          t("serverError"),
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page auth-split-page register-split-page">
      <aside className="auth-visual-panel register-visual-panel">
        <a href="/" className="auth-visual-brand">
          <span>CB</span>
          CareerBridge
        </a>
        <div className="auth-visual-content">
          <p className="eyebrow">START YOUR JOURNEY</p>
          <h2>
            {isJapanese
              ? "あなたに合うキャリアへの第一歩。"
              : "A better career journey begins with the right profile."}
          </h2>
          <p>
            {isJapanese
              ? "学生と企業、それぞれに最適化された安全なキャリアプラットフォームです。"
              : "One secure platform designed for both international students and verified employers."}
          </p>
          <div className="auth-benefit-list">
            <span>01 — {isJapanese ? "メール認証" : "Verify your email"}</span>
            <span>02 — {isJapanese ? "プロフィール作成" : "Complete your profile"}</span>
            <span>03 — {isJapanese ? "マッチング開始" : "Start matching"}</span>
          </div>
        </div>
      </aside>

      <section className="auth-form-panel">
        <section className="auth-card auth-card-modern register-card-modern">
        <a href="/" className="auth-brand">
          <span>CB</span>
          CareerBridge
        </a>

        <h1>{t("createAccount")}</h1>

        <p className="auth-subtitle">
          {t("registerMessage")}
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

          <fieldset className="account-type-fieldset">
            <legend>{t("accountType")}</legend>
            <div className="account-type-options">
              <label className={form.role === "student" ? "selected" : ""}>
                <input type="radio" name="role" value="student" checked={form.role === "student"} onChange={handleChange} />
                <span className="account-type-icon">ST</span>
                <span><strong>{t("student")}</strong><small>{isJapanese ? "仕事を探す" : "Find opportunities"}</small></span>
              </label>
              <label className={form.role === "company" ? "selected" : ""}>
                <input type="radio" name="role" value="company" checked={form.role === "company"} onChange={handleChange} />
                <span className="account-type-icon">CO</span>
                <span><strong>{t("company")}</strong><small>{isJapanese ? "人材を採用する" : "Hire talent"}</small></span>
              </label>
            </div>
          </fieldset>

          <div className="form-row single-language-row">
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
              minLength={8}
              required
            />
            {form.password && (
              <span className="password-strength" aria-live="polite">
                <span className={`strength-bar strength-${passwordStrength}`}><i /><i /><i /><i /></span>
                <small>
                  {isJapanese
                    ? ["弱い", "弱い", "普通", "良い", "強い"][passwordStrength]
                    : ["Very weak", "Weak", "Fair", "Good", "Strong"][passwordStrength]}
                </small>
              </span>
            )}
          </label>

          <label>
            {t("confirmPassword")}
            <input
              type="password"
              name="password_confirm"
              value={form.password_confirm}
              onChange={handleChange}
              autoComplete="new-password"
              minLength={8}
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
      </section>
    </main>
  );
}

export default Register;
