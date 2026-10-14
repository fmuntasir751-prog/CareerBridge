import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

function SiteFooter() {
  const { i18n } = useTranslation();

  const isJapanese =
    i18n.language.startsWith("ja");

  return (
    <footer className="site-footer">
      <div className="site-footer-content">
        <Link
          to="/"
          className="site-footer-brand"
          aria-label="CareerBridge home"
        >
          <span>CB</span>

          <div>
            <strong>CareerBridge</strong>

            <small>
              {isJapanese
                ? "留学生と企業をつなぐ"
                : "Connecting students and companies"}
            </small>
          </div>
        </Link>

        <div className="site-footer-details">
          <p>
            © 2026 CareerBridge
          </p>

          <span aria-hidden="true">•</span>

          <p>
            {isJapanese
              ? "開発チーム：Data Dynamo"
              : "Developed by Data Dynamo"}
          </p>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;