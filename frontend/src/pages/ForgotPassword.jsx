import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import api, {
  getApiErrorMessage,
} from "../services/api";

function ForgotPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState("request");
  const [email, setEmail] = useState("");

  const [form, setForm] = useState({
    otp: "",
    new_password: "",
    new_password_confirm: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleRequestCode = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await api.post(
        "/auth/password-reset/request/",
        { email },
      );

      setMessage(response.data.detail);
      setStep("confirm");
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

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await api.post(
        "/auth/password-reset/confirm/",
        {
          email,
          ...form,
        },
      );

      setMessage(response.data.detail);
      setStep("success");
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
    <main className="auth-page">
      <section className="auth-card">
        <a href="/" className="auth-brand">
          <span>CB</span>
          CareerBridge
        </a>

        <h1>{t("forgotPasswordTitle")}</h1>

        <p className="auth-subtitle">
          {step === "request"
            ? t("forgotPasswordMessage")
            : t("resetPasswordMessage")}
        </p>

        {error && (
          <div className="form-message error">
            {error}
          </div>
        )}

        {message && (
          <div className="form-message success">
            {message}
          </div>
        )}

        {step === "request" && (
          <form
            className="register-form"
            onSubmit={handleRequestCode}
          >
            <label>
              {t("email")}
              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                autoComplete="email"
                required
              />
            </label>

            <button
              className="submit-button"
              type="submit"
              disabled={loading}
            >
              {loading
                ? t("sendingCode")
                : t("sendResetCode")}
            </button>
          </form>
        )}

        {step === "confirm" && (
          <form
            className="register-form"
            onSubmit={handleResetPassword}
          >
            <label>
              {t("email")}
              <input
                type="email"
                value={email}
                autoComplete="email"
                readOnly
              />
            </label>

            <label>
              {t("verificationCode")}
              <input
                name="otp"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={form.otp}
                onChange={handleFormChange}
                autoComplete="one-time-code"
                required
              />
            </label>

            <label>
              {t("newPassword")}
              <input
                type="password"
                name="new_password"
                value={form.new_password}
                onChange={handleFormChange}
                autoComplete="new-password"
                required
              />
            </label>

            <label>
              {t("confirmNewPassword")}
              <input
                type="password"
                name="new_password_confirm"
                value={form.new_password_confirm}
                onChange={handleFormChange}
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
                ? t("resettingPassword")
                : t("resetPassword")}
            </button>
          </form>
        )}

        {step === "success" && (
          <button
            className="submit-button"
            type="button"
            onClick={() => navigate("/login")}
          >
            {t("backToLogin")}
          </button>
        )}

        {step !== "success" && (
          <a href="/login" className="back-link">
            ← {t("backToLogin")}
          </a>
        )}
      </section>
    </main>
  );
}

export default ForgotPassword;