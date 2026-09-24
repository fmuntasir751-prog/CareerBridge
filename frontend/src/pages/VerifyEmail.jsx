import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import api from "../services/api";

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

    const timer = window.setInterval(() => {
      setCooldown((current) => current - 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldown]);

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

  const handleVerify = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await api.post("/auth/verify-email/", {
        email,
        otp,
      });

      setSuccess(t("emailVerificationSuccess"));

      window.setTimeout(() => {
        navigate("/login", {
          replace: true,
          state: {
            message: t("emailVerificationSuccess"),
          },
        });
      }, 1200);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setSuccess("");
    setResending(true);

    try {
      await api.post("/auth/resend-verification/", {
        email,
      });

      setSuccess(t("verificationCodeResent"));
      setCooldown(60);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <a href="/" className="auth-brand">
          <span>CB</span>
          CareerBridge
        </a>

        <h1>{t("verifyEmail")}</h1>

        <p className="auth-subtitle">
          {t("verifyEmailMessage")}
        </p>

        {error && (
          <div className="form-message error">
            {error}
          </div>
        )}

        {success && (
          <div className="form-message success">
            {success}
          </div>
        )}

        <form onSubmit={handleVerify}>
          <label>
            {t("email")}
            <input
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
              }}
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
              pattern="[0-9]{6}"
              value={otp}
              onChange={(event) => {
                setOtp(
                  event.target.value.replace(/\D/g, ""),
                );
              }}
              placeholder="000000"
              required
            />
          </label>

          <button
            className="submit-button"
            type="submit"
            disabled={loading || otp.length !== 6}
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
            resending
            || cooldown > 0
            || !email
          }
        >
          {resending
            ? t("sendingCode")
            : cooldown > 0
              ? `${t("resendCode")} (${cooldown}s)`
              : t("resendCode")}
        </button>

        <a href="/login" className="back-link">
          {t("backToLogin")}
        </a>
      </section>
    </main>
  );
}

export default VerifyEmail;