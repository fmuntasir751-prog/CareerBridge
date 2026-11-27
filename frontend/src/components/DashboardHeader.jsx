import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, NavLink, useNavigate } from "react-router-dom";

import api from "../services/api";

const studentLinks = [
  ["/dashboard", "Dashboard", "ダッシュボード"],
  ["/profile", "My Profile", "プロフィール"],
  ["/jobs", "Jobs", "求人"],
  ["/saved-jobs", "Saved", "保存した求人"],
  ["/applications", "Applications", "応募状況"],
  ["/student-progress", "Progress", "進捗"],
];

const companyLinks = [
  ["/dashboard", "Dashboard", "ダッシュボード"],
  ["/company-profile", "Company Profile", "企業プロフィール"],
  ["/my-jobs", "My Jobs", "求人管理"],
  ["/applications", "Applicants", "応募者"],
  ["/company-analytics", "Analytics", "分析"],
];

function HeaderIcon({ name }) {
  const paths = {
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    logout: <path d="M10 4H5v16h5M14 8l4 4-4 4M8 12h10" />,
    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

function DashboardHeader({ role, unreadCount: providedUnreadCount }) {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [fetchedUnreadCount, setFetchedUnreadCount] = useState(0);
  const mobileNavigationRef = useRef(null);
  const menuButtonRef = useRef(null);

  const isJapanese = i18n.language.startsWith("ja");
  const isStudent = role === "student";
  const navigationLinks = isStudent
    ? studentLinks
    : role === "company"
      ? companyLinks
      : [];

  const unreadCount = providedUnreadCount ?? fetchedUnreadCount;
  const badgeText = unreadCount > 99 ? "99+" : unreadCount;
  const navigationLabel = isJapanese ? "メインナビゲーション" : "Main navigation";
  const notificationsLabel = isJapanese ? "通知" : "Notifications";
  const logoutLabel = isJapanese ? "ログアウト" : "Log out";
  const closeMenuLabel = isJapanese ? "メニューを閉じる" : "Close menu";
  const openMenuLabel = isJapanese ? "メニューを開く" : "Open menu";

  useEffect(() => {
    if (!isStudent || providedUnreadCount != null) {
      return;
    }

    let active = true;

    async function loadUnreadCount() {
      try {
        const { data } = await api.get("/notifications/");
        const items = Array.isArray(data) ? data : data?.results;

        if (active) {
          setFetchedUnreadCount(
            Array.isArray(items)
              ? items.filter((item) => !item.is_read).length
              : 0,
          );
        }
      } catch {
        if (active) {
          setFetchedUnreadCount(0);
        }
      }
    }

    loadUnreadCount();

    return () => {
      active = false;
    };
  }, [isStudent, providedUnreadCount]);

  useEffect(() => {
    mobileNavigationRef.current?.toggleAttribute("inert", !menuOpen);

    if (!menuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const openNotifications = () => {
    closeMenu();
    navigate("/notifications");
  };

  const handleLogout = () => {
    closeMenu();
    localStorage.removeItem("careerbridge-access");
    localStorage.removeItem("careerbridge-refresh");
    navigate("/login", { replace: true });
  };

  const links = navigationLinks.map(([to, en, ja]) => (
    <NavLink
      key={to}
      to={to}
      className={({ isActive }) => (isActive ? "active" : "")}
      onClick={closeMenu}
    >
      {isJapanese ? ja : en}
    </NavLink>
  ));

  return (
    <>
      <header className="shared-dashboard-header">
        <div className="shared-header-inner">
          <Link
            className="shared-header-brand"
            to="/"
            aria-label="CareerBridge"
            onClick={closeMenu}
          >
            <span>CB</span>
            <strong>CareerBridge</strong>
          </Link>

          <nav
            className="shared-desktop-navigation"
            aria-label={navigationLabel}
          >
            {links}
          </nav>

          <div className="shared-header-actions">
            <div
              className="shared-language-switch"
              role="group"
              aria-label={isJapanese ? "言語" : "Language"}
            >
              <HeaderIcon name="globe" />

              <button
                type="button"
                lang="en"
                className={!isJapanese ? "active" : ""}
                aria-pressed={!isJapanese}
                onClick={() => i18n.changeLanguage("en")}
              >
                EN
              </button>

              <button
                type="button"
                lang="ja"
                className={isJapanese ? "active" : ""}
                aria-pressed={isJapanese}
                onClick={() => i18n.changeLanguage("ja")}
              >
                日本語
              </button>
            </div>

            {isStudent && (
              <button
                className="shared-notification-button"
                type="button"
                aria-label={
                  isJapanese
                    ? `通知：未読${unreadCount}件`
                    : `Notifications: ${unreadCount} unread`
                }
                onClick={openNotifications}
              >
                <HeaderIcon name="bell" />
                {unreadCount > 0 && (
                  <span className="shared-notification-count">{badgeText}</span>
                )}
              </button>
            )}

            <button
              className="shared-desktop-logout"
              type="button"
              aria-label={logoutLabel}
              onClick={handleLogout}
            >
              <HeaderIcon name="logout" />
              <span>{logoutLabel}</span>
            </button>

            <button
              ref={menuButtonRef}
              className="shared-mobile-menu-button"
              type="button"
              aria-expanded={menuOpen}
              aria-controls="shared-mobile-navigation"
              aria-label={menuOpen ? closeMenuLabel : openMenuLabel}
              onClick={() => setMenuOpen((current) => !current)}
            >
              <HeaderIcon name={menuOpen ? "close" : "menu"} />
            </button>
          </div>
        </div>

        <div
          id="shared-mobile-navigation"
          ref={mobileNavigationRef}
          className={`shared-mobile-navigation${menuOpen ? " open" : ""}`}
          aria-hidden={!menuOpen}
        >
          <nav aria-label={navigationLabel}>{links}</nav>

          <div className="shared-mobile-navigation-footer">
            {isStudent && (
              <button type="button" onClick={openNotifications}>
                <HeaderIcon name="bell" />
                <span>{notificationsLabel}</span>
                {unreadCount > 0 && <strong>{badgeText}</strong>}
              </button>
            )}

            <button
              className="shared-mobile-logout"
              type="button"
              onClick={handleLogout}
            >
              <HeaderIcon name="logout" />
              <span>{logoutLabel}</span>
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <button
          className="shared-mobile-backdrop"
          type="button"
          aria-label={closeMenuLabel}
          onClick={() => {
            closeMenu();
            menuButtonRef.current?.focus();
          }}
        />
      )}
    </>
  );
}

export default DashboardHeader;