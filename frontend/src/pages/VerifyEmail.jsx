import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import api, {
  getApiErrorMessage,
} from "../services/api";

function VerifyEmail() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState(
    location.state?.email || "",
  );

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const [cooldown, setCooldown] = useState(
    location.state?.email ? 60 : 0,
  );

  useEffect(() => {
    if (cooldown <= 0) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setCooldown((current) =>
        Math.max(current - 1, 0),
      );
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const handleVerify = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (otp.length !== 6) {
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/verify-email/", {
        email: email.trim(),
        otp,
      });

      setSuccess(t("emailVerificationSuccess"));

      window.setTimeout(() => {
        navigate("/login", {
          replace: true,
          state: {
            message: t(
              "emailVerificationSuccess",
            ),
          },
        });
      }, 1200);
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

  const handleResend = async () => {
    if (!email.trim() || cooldown > 0) {
      return;
    }

    setError("");
    setSuccess("");
    setResending(true);

    try {
      await api.post(
        "/auth/resend-verification/",
        {
          email: email.trim(),
        },
      );

      setSuccess(t("verificationCodeResent"));
      setCooldown(60);
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          t("serverError"),
        ),
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link to="/" className="auth-brand">
          <span>CB</span>
          CareerBridge
        </Link>

        <h1>{t("verifyEmail")}</h1>

        <p className="auth-subtitle">
          {t("verifyEmailMessage")}
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

        {success && (
          <div
            className="form-message success"
            role="status"
            aria-live="polite"
          >
            {success}
          </div>
        )}

        <form
          className="register-form"
          onSubmit={handleVerify}
          aria-busy={loading}
        >
          <label>
            {t("email")}
            <input
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
              }}
              autoComplete="email"
              required
            />
          </label>

          <label>
            {t("verificationCode")}
            <input
              className="otp-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              minLength={6}
              pattern="[0-9]{6}"
              value={otp}
              onChange={(event) => {
                setOtp(
                  event.target.value.replace(
                    /\D/g,
                    "",
                  ),
                );
              }}
              placeholder="000000"
              aria-label={t("verificationCode")}
              required
            />
          </label>

          <button
            className="submit-button"
            type="submit"
            disabled={
              loading
              || resending
              || otp.length !== 6
            }
          >
            {loading
              ? t("verifying")
              : t("verifyEmail")}
          </button>
        </form>

        <button
          className="secondary-button otp-resend-button"
          type="button"
          onClick={handleResend}
          disabled={
            loading
            || resending
            || cooldown > 0
            || !email.trim()
          }
        >
          {resending
            ? t("sendingCode")
            : cooldown > 0
              ? `${t("resendCode")} (${cooldown}s)`
              : t("resendCode")}
        </button>

        <Link to="/login" className="back-link">
          ← {t("backToLogin")}
        </Link>
      </section>
    </main>
  );
}

export default VerifyEmail;