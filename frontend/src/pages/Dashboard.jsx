import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import Chatbot from "../components/Chatbot";
import RecommendedJobs from "../components/RecommendedJobs";
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
        localStorage.removeItem("careerbridge-access");
        localStorage.removeItem("careerbridge-refresh");
        navigate("/login");
      }
    };

    loadDashboard();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("careerbridge-access");
    localStorage.removeItem("careerbridge-refresh");
    navigate("/login");
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read,
  ).length;

  const latestNotification = notifications[0];

  if (!user) {
    return (
      <div className="page-loading" role="status">
        {t("loading")}
      </div>
    );
  }

  const isStudent = user.role === "student";

  const studentActions = [
    {
      href: "/profile",
      icon: "👤",
      label: t("editProfile"),
      description: isJapanese
        ? "プロフィールと履歴書を更新"
        : "Update your profile and resume",
      primary: true,
    },
    {
      href: "/jobs",
      icon: "🔎",
      label: t("browseJobs"),
      description: isJapanese
        ? "あなたに合う求人を探す"
        : "Find opportunities that match you",
    },
    {
      href: "/applications",
      icon: "📄",
      label: t("myApplications"),
      description: isJapanese
        ? "応募状況を確認"
        : "Track your application status",
    },
    {
      href: "/saved-jobs",
      icon: "🔖",
      label: t("savedJobs"),
      description: isJapanese
        ? "保存した求人を確認"
        : "Review your saved opportunities",
    },
    {
      href: "/student-progress",
      icon: "📈",
      label: t("careerProgress"),
      description: isJapanese
        ? "就職活動の進捗を確認"
        : "View your career progress",
    },
  ];

  const companyActions = [
    {
      href: "/jobs/new",
      icon: "➕",
      label: t("postJob"),
      description: isJapanese
        ? "新しい求人を公開"
        : "Publish a new opportunity",
      primary: true,
    },
    {
      href: "/applications",
      icon: "👥",
      label: t("manageApplications"),
      description: isJapanese
        ? "応募者を確認・管理"
        : "Review and manage candidates",
    },
    {
      href: "/my-jobs",
      icon: "💼",
      label: t("myPostedJobs"),
      description: isJapanese
        ? "公開した求人を管理"
        : "Manage your published jobs",
    },
    {
      href: "/company-profile",
      icon: "🏢",
      label: t("editCompanyProfile"),
      description: isJapanese
        ? "企業情報を更新"
        : "Keep your company profile current",
    },
    {
      href: "/company-analytics",
      icon: "📊",
      label: t("analytics"),
      description: isJapanese
        ? "採用データを確認"
        : "Review recruitment insights",
    },
    {
      href: "/jobs",
      icon: "🔎",
      label: t("browseJobs"),
      description: isJapanese
        ? "公開中の求人を見る"
        : "Browse active opportunities",
    },
  ];

  const dashboardActions = isStudent
    ? studentActions
    : companyActions;

  const roleLabel = isStudent
    ? isJapanese
      ? "学生"
      : "Student"
    : isJapanese
      ? "企業"
      : "Company";

  const languageLabel =
    user.preferred_language === "ja"
      ? "日本語"
      : "English";

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <Link to="/" className="auth-brand">
          <span>CB</span>
          CareerBridge
        </Link>

        <div className="dashboard-header-actions">
          {isStudent && (
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

          <button type="button" onClick={handleLogout}>
            {t("logout")}
          </button>
        </div>
      </header>

      <section className="dashboard-content">
        <section className="dashboard-welcome-card">
          <div>
            <div className="dashboard-welcome-meta">
              <span className="dashboard-role-badge">
                {roleLabel}
              </span>
              <span>
                {isJapanese
                  ? "CareerBridge ダッシュボード"
                  : "CareerBridge Dashboard"}
              </span>
            </div>

            <h1>
              {t("welcome")},{" "}
              {user.first_name || user.username}!
            </h1>

            <p>
              {isStudent
                ? isJapanese
                  ? "プロフィールを完成させ、あなたに合う仕事を見つけましょう。"
                  : "Complete your profile and discover opportunities that fit your career."
                : isJapanese
                  ? "求人と応募者を一つの場所で効率的に管理できます。"
                  : "Manage jobs and discover suitable candidates in one place."}
            </p>
          </div>

          <div className="dashboard-welcome-icon" aria-hidden="true">
            {isStudent ? "🚀" : "🤝"}
          </div>
        </section>

        <div className="dashboard-action-grid">
          {dashboardActions.map((action) => (
            <Link
              className={`dashboard-action-card ${
                action.primary ? "primary" : ""
              }`}
              to={action.href}
              key={action.href}
            >
              <span
                className="dashboard-action-icon"
                aria-hidden="true"
              >
                {action.icon}
              </span>

              <span>
                <strong>{action.label}</strong>
                <small>{action.description}</small>
              </span>

              <span
                className="dashboard-action-arrow"
                aria-hidden="true"
              >
                →
              </span>
            </Link>
          ))}
        </div>

        {isStudent && latestNotification && (
          <section
            className={`dashboard-notification-preview ${
              latestNotification.is_read ? "read" : "unread"
            }`}
          >
            <div className="dashboard-notification-icon">🔔</div>

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
              onClick={() => navigate("/notifications")}
            >
              {isJapanese ? "通知を見る" : "View notifications"}
            </button>
          </section>
        )}

        {isStudent && <RecommendedJobs />}

        <section className="dashboard-account-section">
          <div className="dashboard-section-heading">
            <div>
              <p className="eyebrow">
                {isJapanese ? "アカウント" : "Account"}
              </p>
              <h2>
                {isJapanese
                  ? "プロフィール概要"
                  : "Profile summary"}
              </h2>
            </div>
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
              <strong>{roleLabel}</strong>
            </article>
            <article>
              <small>{t("preferredLanguage")}</small>
              <strong>{languageLabel}</strong>
            </article>
          </div>
        </section>
      </section>

      <Chatbot />
    </main>
  );
}

export default Dashboard;
