import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const homeCopy = {
  en: {
    eyebrow: "AI-POWERED CAREER PLATFORM",
    howTitle: "One platform, from profile to placement",
    howText: "A clear, secure path for international students and verified employers in Japan.",
    studentTitle: "Built for international students",
    companyTitle: "Smarter hiring for verified companies",
    aiTitle: "Turn your resume into a stronger application",
    aiText: "CareerBridge AI reviews your resume, highlights strengths and gives practical improvement suggestions before you apply.",
    trustTitle: "Designed for trustworthy hiring",
    ctaTitle: "Ready to build your career in Japan?",
    ctaText: "Create your free account and discover opportunities that match your skills, goals and Japanese level.",
  },
  ja: {
    eyebrow: "AIを活用したキャリアプラットフォーム",
    howTitle: "プロフィール作成から採用まで、ひとつの場所で",
    howText: "留学生と認証済み企業をつなぐ、分かりやすく安全な就職活動フローです。",
    studentTitle: "留学生の就職活動をサポート",
    companyTitle: "認証済み企業の採用活動を効率化",
    aiTitle: "履歴書を、より伝わる応募書類へ",
    aiText: "CareerBridge AIが履歴書を分析し、強みと改善点を応募前に分かりやすく提案します。",
    trustTitle: "安心できる採用のための設計",
    ctaTitle: "日本でのキャリアを始めませんか？",
    ctaText: "無料アカウントを作成し、スキル・希望・日本語レベルに合う求人を見つけましょう。",
  },
};

function Home() {
  const { t, i18n } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isJapanese = i18n.language.startsWith("ja");
  const copy = homeCopy[isJapanese ? "ja" : "en"];

  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const changeLanguage = (language) => {
    i18n.changeLanguage(language);
    localStorage.setItem("careerbridge-language", language);
  };

  const steps = isJapanese
    ? [
        ["01", "プロフィールを作成", "スキル、希望条件、日本語レベルを登録します。"],
        ["02", "求人を比較", "マッチ度と条件を確認して求人を保存します。"],
        ["03", "応募状況を管理", "応募から選考結果まで、ひとつの画面で確認できます。"],
      ]
    : [
        ["01", "Build your profile", "Add your skills, preferences and Japanese level."],
        ["02", "Compare opportunities", "Review match insights, requirements and save the best roles."],
        ["03", "Track every application", "Follow your progress from application to final decision."],
      ];

  return (
    <div className="app public-home">
      <header className="navbar public-navbar">
        <Link className="brand" to="/" aria-label="CareerBridge home">
          <span className="brand-icon">CB</span>
          {t("brand")}
        </Link>

        <button
          className="mobile-menu-button"
          type="button"
          aria-expanded={menuOpen}
          aria-label={isJapanese ? "メニュー" : "Menu"}
          onClick={() => setMenuOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`public-nav-panel ${menuOpen ? "open" : ""}`}>
          <nav className="nav-links" aria-label="Primary navigation">
            <Link to="/">{t("home")}</Link>
            <Link to="/jobs">{t("jobs")}</Link>
            <a href="#features">{isJapanese ? "機能" : "Features"}</a>
          </nav>
          <div className="nav-actions">
            <div className="language-switch" aria-label="Language">
              <button className={!isJapanese ? "active" : ""} onClick={() => changeLanguage("en")} type="button">EN</button>
              <button className={isJapanese ? "active" : ""} onClick={() => changeLanguage("ja")} type="button">日本語</button>
            </div>
            <Link className="login-link" to="/login">{t("login")}</Link>
            <Link className="register-link" to="/register">{t("register")}</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-glow hero-glow-one" />
          <div className="hero-glow hero-glow-two" />
          <section className="hero-content">
            <p className="eyebrow">{copy.eyebrow}</p>
            <h1>{t("heroTitle")}</h1>
            <p className="hero-description">{t("heroText")}</p>
            <div className="hero-buttons">
              <Link className="primary-button" to="/register">{t("getStarted")} <span aria-hidden="true">→</span></Link>
              <Link className="secondary-button" to="/jobs">{t("jobs")}</Link>
            </div>
            <div className="hero-trust-row">
              <span>✓ {isJapanese ? "認証済み企業" : "Verified companies"}</span>
              <span>✓ {isJapanese ? "日英対応" : "English & Japanese"}</span>
              <span>✓ {isJapanese ? "安全な応募管理" : "Secure applications"}</span>
            </div>
          </section>

          <section className="hero-card" aria-label="AI matching preview">
            <div className="card-header"><span className="status-dot" />CareerBridge AI <span className="live-pill">LIVE</span></div>
            <div className="match-score-row"><div><div className="match-score">92%</div><p>Job Match Score</p></div><div className="score-ring" aria-hidden="true"><span>92</span></div></div>
            {[["React", "95%", "95%"], ["Django", "88%", "88%"], ["Japanese", "N2", "82%"]].map(([name, value, width]) => (
              <div className="skill-item" key={name}>
                <div className="skill"><span>{name}</span><strong>{value}</strong></div>
                <div className="progress"><div style={{ width }} /></div>
              </div>
            ))}
          </section>
        </section>

        <section className="home-section home-how" id="features">
          <div className="section-intro"><p className="eyebrow">{isJapanese ? "利用の流れ" : "HOW IT WORKS"}</p><h2>{copy.howTitle}</h2><p>{copy.howText}</p></div>
          <div className="home-step-grid">
            {steps.map(([number, title, description]) => (
              <article className="home-step-card" key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p></article>
            ))}
          </div>
        </section>

        <section className="home-section home-audience-grid">
          <article className="audience-card student-card">
            <div className="feature-symbol">ST</div><p className="eyebrow">{isJapanese ? "学生向け" : "FOR STUDENTS"}</p><h2>{copy.studentTitle}</h2>
            <ul><li>{isJapanese ? "プロフィールに合う求人の提案" : "Personalized job recommendations"}</li><li>{isJapanese ? "AI履歴書分析と改善提案" : "AI resume analysis and suggestions"}</li><li>{isJapanese ? "保存・応募・選考状況の管理" : "Saved jobs and application tracking"}</li></ul>
            <Link to="/register">{isJapanese ? "学生として登録" : "Join as a student"} →</Link>
          </article>
          <article className="audience-card company-card">
            <div className="feature-symbol">CO</div><p className="eyebrow">{isJapanese ? "企業向け" : "FOR COMPANIES"}</p><h2>{copy.companyTitle}</h2>
            <ul><li>{isJapanese ? "認証済み企業による求人公開" : "Trusted verified-company publishing"}</li><li>{isJapanese ? "応募者とのマッチ度分析" : "Candidate-to-role match analysis"}</li><li>{isJapanese ? "採用フローと分析の一元管理" : "Recruitment workflow and analytics"}</li></ul>
            <Link to="/register">{isJapanese ? "企業として登録" : "Join as a company"} →</Link>
          </article>
        </section>

        <section className="home-section ai-feature-section">
          <div className="ai-feature-visual"><div className="resume-sheet"><span className="resume-avatar" /><i /><i /><i /><div className="analysis-chip">AI <strong>+18%</strong></div></div></div>
          <div className="ai-feature-copy"><p className="eyebrow">AI RESUME ANALYSIS</p><h2>{copy.aiTitle}</h2><p>{copy.aiText}</p><div className="ai-points"><span>✓ {isJapanese ? "強みを発見" : "Identify strengths"}</span><span>✓ {isJapanese ? "不足スキルを確認" : "Find skill gaps"}</span><span>✓ {isJapanese ? "具体的な改善提案" : "Get actionable feedback"}</span></div></div>
        </section>

        <section className="home-section trust-section">
          <div className="section-intro"><p className="eyebrow">TRUST & SECURITY</p><h2>{copy.trustTitle}</h2></div>
          <div className="trust-grid"><article><span>✓</span><h3>{isJapanese ? "企業認証" : "Company verification"}</h3><p>{isJapanese ? "管理者が企業情報を確認してから求人を公開します。" : "Employers are reviewed before they can publish jobs."}</p></article><article><span>◎</span><h3>JWT Security</h3><p>{isJapanese ? "役割に応じた安全なアクセス制御を行います。" : "Secure role-based access for students and companies."}</p></article><article><span>AI</span><h3>{isJapanese ? "透明なマッチング" : "Transparent matching"}</h3><p>{isJapanese ? "マッチ度の理由と改善点を分かりやすく表示します。" : "Understand match factors and areas to improve."}</p></article></div>
        </section>

        <section className="home-cta"><div><p className="eyebrow">CAREERBRIDGE</p><h2>{copy.ctaTitle}</h2><p>{copy.ctaText}</p></div><Link className="cta-button" to="/register">{t("getStarted")} →</Link></section>
      </main>
    </div>
  );
}

export default Home;
