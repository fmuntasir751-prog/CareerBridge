import { useEffect } from "react";
import { useTranslation } from "react-i18next";

function App() {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const changeLanguage = (language) => {
    i18n.changeLanguage(language);
    localStorage.setItem("careerbridge-language", language);
  };

  return (
    <div className="app">
      <header className="navbar">
        <a className="brand" href="/">
          <span className="brand-icon">CB</span>
          {t("brand")}
        </a>

        <nav className="nav-links">
          <a href="/">{t("home")}</a>
          <a href="/jobs">{t("jobs")}</a>
        </nav>

        <div className="nav-actions">
          <div className="language-switch">
            <button
              className={i18n.language === "en" ? "active" : ""}
              onClick={() => changeLanguage("en")}
              type="button"
            >
              EN
            </button>

            <button
              className={i18n.language === "ja" ? "active" : ""}
              onClick={() => changeLanguage("ja")}
              type="button"
            >
              日本語
            </button>
          </div>

          <a className="login-link" href="/login">
            {t("login")}
          </a>

          <a className="register-link" href="/register">
            {t("register")}
          </a>
        </div>
      </header>

      <main className="hero">
        <section className="hero-content">
          <p className="eyebrow">AI-POWERED CAREER PLATFORM</p>

          <h1>{t("heroTitle")}</h1>

          <p className="hero-description">{t("heroText")}</p>

          <div className="hero-buttons">
            <a className="primary-button" href="/register">
              {t("getStarted")} →
            </a>

            <a className="secondary-button" href="/jobs">
              {t("jobs")}
            </a>
          </div>
        </section>

        <section className="hero-card">
          <div className="card-header">
            <span className="status-dot"></span>
            CareerBridge AI
          </div>

          <div className="match-score">92%</div>
          <p>Job Match Score</p>

          <div className="skill">
            <span>React</span>
            <strong>95%</strong>
          </div>

          <div className="progress">
            <div style={{ width: "95%" }}></div>
          </div>

          <div className="skill">
            <span>Django</span>
            <strong>88%</strong>
          </div>

          <div className="progress">
            <div style={{ width: "88%" }}></div>
          </div>

          <div className="skill">
            <span>Japanese</span>
            <strong>N2</strong>
          </div>

          <div className="progress">
            <div style={{ width: "82%" }}></div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
