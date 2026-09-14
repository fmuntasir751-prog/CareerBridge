import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import api from "../services/api";

function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await api.get("/auth/me/");
        setUser(response.data);
      } catch {
        localStorage.removeItem("careerbridge-access");
        localStorage.removeItem("careerbridge-refresh");
        navigate("/login");
      }
    };

    loadUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("careerbridge-access");
    localStorage.removeItem("careerbridge-refresh");
    navigate("/login");
  };

  if (!user) {
    return (
      <div className="page-loading">
        {t("loading")}
      </div>
    );
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <a href="/" className="auth-brand">
          <span>CB</span>
          CareerBridge
        </a>

        <button type="button" onClick={handleLogout}>
          {t("logout")}
        </button>
      </header>

      <section className="dashboard-content">
        <p className="eyebrow">
          {t("dashboard")}
        </p>

        <h1>
          {t("welcome")},{" "}
          {user.first_name || user.username}!
        </h1>

        <div className="dashboard-actions">
          {user.role === "student" && (
            <>
              <a
                className="primary-button"
                href="/profile"
              >
                {t("editProfile")}
              </a>

              <a
                className="secondary-button"
                href="/jobs"
              >
                {t("browseJobs")}
              </a>
              <a className="secondary-button" href="/applications">
  {t("myApplications")}
</a>
            </>
          )}

          {user.role === "company" && (
            <>
              <a
                className="primary-button"
                href="/jobs/new"
              >
                {t("postJob")}
              </a>

              <a
                className="secondary-button"
                href="/jobs"
              >
                {t("browseJobs")}
              </a>
              <a className="secondary-button" href="/applications">
  {t("manageApplications")}
</a>
<a className="secondary-button" href="/my-jobs">
  {t("myPostedJobs")}
</a>
<a
  className="secondary-button"
  href="/company-profile"
>
  {t("editCompanyProfile")}
</a>
            </>
          )}
        </div>

        <div className="profile-summary">
          <article>
            <small>{t("username")}</small>
            <strong>{user.username}</strong>
          </article>

          <article>
            <small>{t("email")}</small>
            <strong>{user.email}</strong>
          </article>

          <article>
            <small>{t("accountType")}</small>
            <strong>{user.role}</strong>
          </article>

          <article>
            <small>{t("preferredLanguage")}</small>
            <strong>{user.preferred_language}</strong>
          </article>
        </div>
      </section>
    </main>
  );
}

export default Dashboard;