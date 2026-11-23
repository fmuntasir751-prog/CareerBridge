import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Link,
  NavLink,
  useNavigate,
} from "react-router-dom";

import Chatbot from "../components/Chatbot";
import RecommendedJobs from "../components/RecommendedJobs";
import api from "../services/api";

function DashboardIcon({ name }) {
  const paths = {
    account: (
      <>
        <circle cx="12" cy="8" r="3" />
        <path d="M5.5 19c.7-3.1 3.1-5 6.5-5s5.8 1.9 6.5 5" />
      </>
    ),
    language: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3a15 15 0 0 1 0 18" />
        <path d="M12 3a15 15 0 0 0 0 18" />
      </>
    ),
    notification: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    profile: (
      <>
        <circle cx="12" cy="8" r="3" />
        <path d="M5 20c.8-4 3.2-6 7-6s6.2 2 7 6" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    applications: (
      <>
        <path d="M6 3h9l4 4v14H6z" />
        <path d="M14 3v5h5" />
        <path d="M9 13h6M9 17h6" />
      </>
    ),
    saved: (
      <path d="M6 3h12v18l-6-4-6 4z" />
    ),
    progress: (
      <>
        <path d="M4 19V9M10 19V5M16 19v-7" />
        <path d="M22 19H2" />
      </>
    ),
    add: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="10" r="2.5" />
        <path d="M3 20c.6-4 2.8-6 6-6s5.4 2 6 6" />
        <path d="M15 15c3 0 5 1.7 5.7 4.5" />
      </>
    ),
    jobs: (
      <>
        <rect
          x="3"
          y="7"
          width="18"
          height="13"
          rx="2"
        />
        <path d="M8 7V4h8v3M3 12h18" />
      </>
    ),
    company: (
      <>
        <path d="M4 21V5h10v16M14 10h6v11" />
        <path d="M8 9h2M8 13h2M8 17h2" />
        <path d="M17 14h1M17 18h1" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name] || paths.profile}
    </svg>
  );
}

function Dashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [notifications, setNotifications] =
    useState([]);
  const [studentProfile, setStudentProfile] =
    useState(null);

  const isJapanese =
    i18n.language.startsWith("ja");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const userResponse = await api.get(
          "/auth/me/",
        );

        const currentUser = userResponse.data;
        setUser(currentUser);

        if (currentUser.role === "student") {
          const [
            notificationResult,
            profileResult,
          ] = await Promise.allSettled([
            api.get("/notifications/"),
            api.get("/profiles/student/me/"),
          ]);

          if (
            notificationResult.status
            === "fulfilled"
          ) {
            setNotifications(
              notificationResult.value.data,
            );
          } else {
            setNotifications([]);
          }

          if (
            profileResult.status
            === "fulfilled"
          ) {
            setStudentProfile(
              profileResult.value.data,
            );
          } else {
            setStudentProfile(null);
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
      <div
        className="page-loading"
        role="status"
      >
        {t("loading")}
      </div>
    );
  }

  const isStudent = user.role === "student";

  const profileReady = Boolean(
    isStudent
    && studentProfile?.matching_ready,
  );

  const studentActions = [
    {
      href: "/profile",
      icon: "profile",
      label: t("editProfile"),
      description: isJapanese
        ? "プロフィールと履歴書を更新"
        : "Update your profile and resume",
      primary: true,
    },
    {
      href: "/jobs",
      icon: "search",
      label: t("browseJobs"),
      description: isJapanese
        ? "あなたに合う求人を探す"
        : "Find opportunities that match you",
    },
    {
      href: "/applications",
      icon: "applications",
      label: t("myApplications"),
      description: isJapanese
        ? "応募状況を確認"
        : "Track your application status",
    },
    {
      href: "/saved-jobs",
      icon: "saved",
      label: t("savedJobs"),
      description: isJapanese
        ? "保存した求人を確認"
        : "Review your saved opportunities",
    },
    {
      href: "/student-progress",
      icon: "progress",
      label: t("careerProgress"),
      description: isJapanese
        ? "就職活動の進捗を確認"
        : "View your career progress",
    },
  ];

  const companyActions = [
    {
      href: "/jobs/new",
      icon: "add",
      label: t("postJob"),
      description: isJapanese
        ? "新しい求人を公開"
        : "Publish a new opportunity",
      primary: true,
    },
    {
      href: "/applications",
      icon: "users",
      label: t("manageApplications"),
      description: isJapanese
        ? "応募者を確認・管理"
        : "Review and manage candidates",
    },
    {
      href: "/my-jobs",
      icon: "jobs",
      label: t("myPostedJobs"),
      description: isJapanese
        ? "公開した求人を管理"
        : "Manage your published jobs",
    },
    {
      href: "/company-profile",
      icon: "company",
      label: t("editCompanyProfile"),
      description: isJapanese
        ? "企業情報を更新"
        : "Keep your company profile current",
    },
    {
      href: "/company-analytics",
      icon: "progress",
      label: t("analytics"),
      description: isJapanese
        ? "採用データを確認"
        : "Review recruitment insights",
    },
    {
      href: "/jobs",
      icon: "search",
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

  // Language the page is shown in right now.
  const languageLabel = isJapanese
    ? "日本語"
    : "English";

  // Language saved in the account settings.
  const preferredLanguageLabel =
    user.preferred_language === "ja"
      ? "日本語"
      : "English";

  const studentBannerText = profileReady
    ? isJapanese
      ? "おかえりなさい。あなたに合う求人を確認しましょう。"
      : "Welcome back! See the jobs that match you."
    : isJapanese
      ? "プロフィールを完成させ、あなたに合う仕事を見つけましょう。"
      : "Complete your profile and discover opportunities that fit your career.";

  const companyBannerText = isJapanese
    ? "求人と応募者を一つの場所で効率的に管理できます。"
    : "Manage jobs and discover suitable candidates in one place.";

  const missingFieldLabels = {
    skills: isJapanese
      ? "スキル"
      : "Skills",
    location: isJapanese
      ? "希望勤務地"
      : "Preferred location",
    desired_job_title: isJapanese
      ? "希望職種"
      : "Desired job title",
    preferred_workplace: isJapanese
      ? "希望する働き方"
      : "Workplace preference",
    japanese_level: isJapanese
      ? "日本語レベル"
      : "Japanese level",
    desired_salary_min: isJapanese
      ? "希望給与"
      : "Desired salary",
  };

  const missingFieldSuggestions = {
    skills: isJapanese
      ? "スキルを追加してください。"
      : "Add your skills to improve job matching.",
    location: isJapanese
      ? "希望勤務地を追加してください。"
      : "Add your preferred location to improve job matching.",
    desired_job_title: isJapanese
      ? "希望職種を追加してください。"
      : "Add your desired job title to improve job matching.",
    preferred_workplace: isJapanese
      ? "希望する働き方を追加してください。"
      : "Add your workplace preference to improve job matching.",
    japanese_level: isJapanese
      ? "日本語レベルを追加してください。"
      : "Add your Japanese level to improve job matching.",
    desired_salary_min: isJapanese
      ? "希望給与を追加してください。"
      : "Add your desired salary to improve job matching.",
  };

  const firstMissingField =
    studentProfile
      ?.missing_matching_fields?.[0];

  const profileSuggestion =
    missingFieldSuggestions[firstMissingField]
    || (
      isJapanese
        ? "不足している情報を追加してください。"
        : "Add the missing information to improve job matching."
    );

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <Link
          to="/"
          className="auth-brand"
        >
          <span>CB</span>
          CareerBridge
        </Link>

        <nav
          className="dashboard-primary-nav"
          aria-label={
            isJapanese
              ? "メインナビゲーション"
              : "Main navigation"
          }
        >
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive ? "active" : ""
            }
          >
            {isJapanese
              ? "ダッシュボード"
              : "Dashboard"}
          </NavLink>

          {isStudent ? (
            <>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  isActive ? "active" : ""
                }
              >
                {isJapanese
                  ? "プロフィール"
                  : "My Profile"}
              </NavLink>

              <NavLink
                to="/jobs"
                className={({ isActive }) =>
                  isActive ? "active" : ""
                }
              >
                {isJapanese ? "求人" : "Jobs"}
              </NavLink>

              <NavLink
                to="/saved-jobs"
                className={({ isActive }) =>
                  isActive ? "active" : ""
                }
              >
                {isJapanese
                  ? "保存した求人"
                  : "Saved"}
              </NavLink>

              <NavLink
                to="/applications"
                className={({ isActive }) =>
                  isActive ? "active" : ""
                }
              >
                {isJapanese
                  ? "応募状況"
                  : "Applications"}
              </NavLink>
            </>
          ) : (
            <>
              <NavLink
                to="/company-profile"
                className={({ isActive }) =>
                  isActive ? "active" : ""
                }
              >
                {isJapanese
                  ? "企業プロフィール"
                  : "Company Profile"}
              </NavLink>

              <NavLink
                to="/my-jobs"
                className={({ isActive }) =>
                  isActive ? "active" : ""
                }
              >
                {isJapanese
                  ? "求人管理"
                  : "My Jobs"}
              </NavLink>

              <NavLink
                to="/applications"
                className={({ isActive }) =>
                  isActive ? "active" : ""
                }
              >
                {isJapanese
                  ? "応募者"
                  : "Applicants"}
              </NavLink>

              <NavLink
                to="/company-analytics"
                className={({ isActive }) =>
                  isActive ? "active" : ""
                }
              >
                {isJapanese
                  ? "分析"
                  : "Analytics"}
              </NavLink>
            </>
          )}
        </nav>

        <div className="dashboard-header-actions">
          {isStudent && (
            <button
              className="notification-button"
              type="button"
              aria-label={
                isJapanese
                  ? "通知"
                  : "Notifications"
              }
              onClick={() =>
                navigate("/notifications")
              }
            >
              <span
                className="header-notification-icon"
                aria-hidden="true"
              >
                <DashboardIcon
                  name="notification"
                />
              </span>

              <span className="notification-button-text">
                {isJapanese
                  ? "通知"
                  : "Notifications"}
              </span>

              {unreadCount > 0 && (
                <span className="notification-count">
                  {unreadCount > 99
                    ? "99+"
                    : unreadCount}
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
                ? studentBannerText
                : companyBannerText}
            </p>
          </div>

          <div
            className="dashboard-welcome-icon"
            aria-hidden="true"
          >
            <DashboardIcon
              name={
                isStudent
                  ? "jobs"
                  : "company"
              }
            />
          </div>
        </section>

        <section
          className="dashboard-overview-strip"
          aria-label={
            isJapanese ? "概要" : "Overview"
          }
        >
          <article>
            <span className="overview-icon">
              <DashboardIcon name="account" />
            </span>

            <div>
              <small>
                {isJapanese
                  ? "アカウント"
                  : "Account"}
              </small>
              <strong>{roleLabel}</strong>
            </div>
          </article>

          <article>
            <span className="overview-icon">
              <DashboardIcon name="language" />
            </span>

            <div>
              <small>
                {isJapanese
                  ? "使用言語"
                  : "Language"}
              </small>
              <strong>{languageLabel}</strong>
            </div>
          </article>

          <article>
            <span className="overview-icon">
              <DashboardIcon
                name="notification"
              />
            </span>

            <div>
              <small>
                {isJapanese
                  ? "未読通知"
                  : "Unread alerts"}
              </small>
              <strong>
                {isStudent ? unreadCount : "—"}
              </strong>
            </div>
          </article>
        </section>

        {isStudent &&
          studentProfile &&
          (
            studentProfile.matching_ready ? (
              <section
                className="profile-complete-row"
                aria-label={
                  isJapanese
                    ? "プロフィールは完成しています"
                    : "Profile is complete"
                }
              >
                <span
                  className="profile-complete-check"
                  aria-hidden="true"
                >
                  ✓
                </span>

                <div>
                  <strong>
                    {isJapanese
                      ? "プロフィール完成"
                      : "Profile complete"}
                  </strong>

                  <small>
                    {isJapanese
                      ? "求人マッチングの準備ができました。"
                      : "Your profile is ready for job matching."}
                  </small>
                </div>

                <Link to="/profile">
                  {isJapanese ? "編集" : "Edit"}
                </Link>
              </section>
            ) : (
              <section className="profile-completion-card incomplete">
                <div className="profile-completion-header">
                  <div>
                    <p className="profile-setup-label">
                      {isJapanese
                        ? "プロフィール設定"
                        : "Profile setup"}
                    </p>

                    <h2>
                      {isJapanese
                        ? "プロフィールを完成させてください"
                        : "Complete your profile"}
                    </h2>

                    <p className="profile-completion-description">
                      {profileSuggestion}
                    </p>
                  </div>

                  <strong className="profile-completion-score">
                    {
                      studentProfile
                        .profile_completion
                    }
                    %
                  </strong>
                </div>

                <div
                  className="profile-completion-progress"
                  role="progressbar"
                  aria-label={
                    isJapanese
                      ? "プロフィール完成度"
                      : "Profile completion"
                  }
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-valuenow={
                    studentProfile
                      .profile_completion
                  }
                  aria-valuetext={
                    `${studentProfile.profile_completion}%`
                  }
                >
                  <span
                    style={{
                      width:
                        `${studentProfile.profile_completion}%`,
                    }}
                  />
                </div>

                <div className="profile-missing-section">
                  <small>
                    {isJapanese
                      ? "未入力の必須項目"
                      : "Required information still missing"}
                  </small>

                  <div className="profile-missing-list">
                    {studentProfile
                      .missing_matching_fields
                      ?.map((field) => (
                        <span key={field}>
                          {
                            missingFieldLabels[
                              field
                            ] || field
                          }
                        </span>
                      ))}
                  </div>

                  <Link
                    className="primary-button"
                    to="/profile"
                  >
                    {isJapanese
                      ? "プロフィールを完成させる"
                      : "Complete profile"}
                  </Link>
                </div>
              </section>
            )
          )}

        <div className="dashboard-action-grid">
          {dashboardActions.map((action) => (
            <Link
              className={
                `dashboard-action-card ${
                  action.primary
                    ? "primary"
                    : ""
                }`
              }
              to={action.href}
              key={action.href}
            >
              <span
                className="dashboard-action-icon"
                aria-hidden="true"
              >
                <DashboardIcon
                  name={action.icon}
                />
              </span>

              <span>
                <strong>{action.label}</strong>
                <small>
                  {action.description}
                </small>
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

        {isStudent &&
          latestNotification && (
            <section
              className={
                `dashboard-notification-preview ${
                  latestNotification.is_read
                    ? "read"
                    : "unread"
                }`
              }
            >
              <div className="dashboard-notification-icon">
                <DashboardIcon
                  name="notification"
                />
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

        {profileReady && <RecommendedJobs />}

        <section className="dashboard-account-section">
          <div className="dashboard-section-heading">
            <div>
              <p className="eyebrow">
                {isJapanese
                  ? "アカウント"
                  : "Account"}
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
              <small>
                {t("accountType")}
              </small>
              <strong>{roleLabel}</strong>
            </article>

            <article>
              <small>
                {t("preferredLanguage")}
              </small>
              <strong>{preferredLanguageLabel}</strong>
            </article>
          </div>
        </section>
      </section>

      <Chatbot />
    </main>
  );
}

export default Dashboard;
