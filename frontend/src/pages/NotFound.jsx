import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

function NotFound() {
  const { t } = useTranslation();

  return (
    <main className="auth-page">
      <section className="auth-card not-found-card">
        <a href="/" className="auth-brand">
          <span>CB</span>
          CareerBridge
        </a>

        <p className="error-code">404</p>
        <h1>{t("pageNotFound")}</h1>

        <p className="auth-subtitle">
          {t("pageNotFoundMessage")}
        </p>

        <Link className="submit-button home-button" to="/">
          {t("backHome")}
        </Link>
      </section>
    </main>
  );
}

export default NotFound;