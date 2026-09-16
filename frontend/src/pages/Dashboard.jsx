import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import Chatbot from "../components/Chatbot";
import api from "../services/api";

function Dashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const isJapanese = i18n.language.startsWith("ja");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const userResponse = await api.get("/auth/me/");
        const currentUser = userResponse.data;

        setUser(currentUser);

        if (currentUser.role === "student") {
          try {
            const notificationResponse = await api.get(
              "/notifications/",
            );

            setNotifications(notificationResponse.data);
          } catch {
            setNotifications([]);
          }
        }
      } catch {
        localStorage.removeItem(
          "careerbridge-access",
        );
        localStorage.removeItem(
          "careerbridge-refresh",
        );

        navigate("/login");
      }
    };

    loadDashboard();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem(
      "careerbridge-access",
    );
    localStorage.removeItem(
      "careerbridge-refresh",
    );

    navigate("/login");
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read,
  ).length;

  const latestNotification = notifications[0];

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

        <div className="dashboard-header-actions">
          {user.role === "student" && (
            <button
              className="notification-button"
              type="button"
              aria-label={
                isJapanese ? "通知" : "Notifications"
              }
              onClick={() => navigate("/notifications")}
            >
              <span aria-hidden="true">🔔</span>

              <span className="notification-button-text">
                {isJapanese ? "通知" : "Notifications"}
              </span>

              {unreadCount > 0 && (
                <span className="notification-count">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleLogout}
          >
            {t("logout")}
          </button>
        </div>
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

              <a
                className="secondary-button"
                href="/applications"
              >
                {t("myApplications")}
              </a>

              <a
                className="secondary-button"
                href="/saved-jobs"
              >
                {t("savedJobs")}
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

              <a
                className="secondary-button"
                href="/applications"
              >
                {t("manageApplications")}
              </a>

              <a
                className="secondary-button"
                href="/my-jobs"
              >
                {t("myPostedJobs")}
              </a>

              <a
                className="secondary-button"
                href="/company-profile"
              >
                {t("editCompanyProfile")}
              </a>
              <a
  className="secondary-button"
  href="/company-analytics"
>
  {t("analytics")}
</a>
            </>
          )}
        </div>

        {user.role === "student" &&
          latestNotification && (
            <section
              className={`dashboard-notification-preview ${
                latestNotification.is_read
                  ? "read"
                  : "unread"
              }`}
            >
              <div className="dashboard-notification-icon">
                🔔
              </div>

              <div>
                <small>
                  {latestNotification.is_read
                    ? isJapanese
                      ? "最新の通知"
                      : "Latest notification"
                    : isJapanese
                      ? "新しい通知"
                      : "New notification"}
                </small>

                <h2>
                  {isJapanese
                    ? latestNotification.title_ja
                    : latestNotification.title_en}
                </h2>

                <p>
                  {isJapanese
                    ? latestNotification.message_ja
                    : latestNotification.message_en}
                </p>
              </div>

              <button
                className="secondary-button"
                type="button"
                onClick={() =>
                  navigate("/notifications")
                }
              >
                {isJapanese
                  ? "通知を見る"
                  : "View notifications"}
              </button>
            </section>
          )}

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
            <small>
              {t("preferredLanguage")}
            </small>

            <strong>
              {user.preferred_language}
            </strong>
          </article>
        </div>
      </section>

      <Chatbot />
    </main>
  );
}

export default Dashboard;