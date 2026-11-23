import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  Link,
  NavLink,
  useNavigate,
} from "react-router-dom";

function HeaderIcon({ name }) {
  const paths = {
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    menu: (
      <path d="M4 7h16M4 12h16M4 17h16" />
    ),
    close: (
      <path d="m6 6 12 12M18 6 6 18" />
    ),
    logout: (
      <>
        <path d="M10 4H5v16h5" />
        <path d="M14 8l4 4-4 4M8 12h10" />
      </>
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3a15 15 0 0 1 0 18" />
        <path d="M12 3a15 15 0 0 0 0 18" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {paths[name] || paths.menu}
    </svg>
  );
}

function DashboardHeader({
  role,
  unreadCount = 0,
}) {
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const mobileNavigationRef = useRef(null);

  const isJapanese =
    i18n.language.startsWith("ja");

  const isStudent = role === "student";
  const isCompany = role === "company";

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    document.addEventListener(
      "keydown",
      closeOnEscape,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      document.removeEventListener(
        "keydown",
        closeOnEscape,
      );
    };
  }, [menuOpen]);

  // While the mobile menu is closed, its links must not be
  // reachable with the Tab key. Using the DOM attribute works
  // with both React 18 and React 19.
  useEffect(() => {
    const menu = mobileNavigationRef.current;

    if (!menu) {
      return;
    }

    if (menuOpen) {
      menu.removeAttribute("inert");
    } else {
      menu.setAttribute("inert", "");
    }
  }, [menuOpen]);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleNavigation = (path) => {
    closeMenu();
    navigate(path);
  };

  const handleLogout = () => {
    closeMenu();

    localStorage.removeItem(
      "careerbridge-access",
    );
    localStorage.removeItem(
      "careerbridge-refresh",
    );

    navigate("/login");
  };

  const setLanguage = (language) => {
    i18n.changeLanguage(language);
  };

  const studentLinks = [
    {
      to: "/dashboard",
      en: "Dashboard",
      ja: "ダッシュボード",
    },
    {
      to: "/profile",
      en: "My Profile",
      ja: "プロフィール",
    },
    {
      to: "/jobs",
      en: "Jobs",
      ja: "求人",
    },
    {
      to: "/saved-jobs",
      en: "Saved",
      ja: "保存した求人",
    },
    {
      to: "/applications",
      en: "Applications",
      ja: "応募状況",
    },
    {
      to: "/student-progress",
      en: "Progress",
      ja: "進捗",
    },
  ];

  const companyLinks = [
    {
      to: "/dashboard",
      en: "Dashboard",
      ja: "ダッシュボード",
    },
    {
      to: "/company-profile",
      en: "Company Profile",
      ja: "企業プロフィール",
    },
    {
      to: "/my-jobs",
      en: "My Jobs",
      ja: "求人管理",
    },
    {
      to: "/applications",
      en: "Applicants",
      ja: "応募者",
    },
    {
      to: "/company-analytics",
      en: "Analytics",
      ja: "分析",
    },
  ];

  const navigationLinks = isStudent
    ? studentLinks
    : isCompany
      ? companyLinks
      : [];

  const navigationLabel = isJapanese
    ? "メインナビゲーション"
    : "Main navigation";

  return (
    <>
      <header className="shared-dashboard-header">
        <div className="shared-header-inner">
          <Link
            className="shared-header-brand"
            to="/"
            onClick={closeMenu}
          >
            <span>CB</span>
            <strong>CareerBridge</strong>
          </Link>

          <nav
            className="shared-desktop-navigation"
            aria-label={navigationLabel}
          >
            {navigationLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  isActive ? "active" : ""
                }
                onClick={closeMenu}
              >
                {isJapanese
                  ? link.ja
                  : link.en}
              </NavLink>
            ))}
          </nav>

          <div className="shared-header-actions">
            <div
              className="shared-language-switch"
              role="group"
              aria-label={
                isJapanese
                  ? "言語"
                  : "Language"
              }
            >
              <HeaderIcon name="globe" />

              <button
                type="button"
                className={
                  !isJapanese ? "active" : ""
                }
                aria-pressed={!isJapanese}
                onClick={() =>
                  setLanguage("en")
                }
              >
                EN
              </button>

              <button
                type="button"
                lang="ja"
                className={
                  isJapanese ? "active" : ""
                }
                aria-pressed={isJapanese}
                onClick={() =>
                  setLanguage("ja")
                }
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
                onClick={() =>
                  handleNavigation("/notifications")
                }
              >
                <HeaderIcon name="bell" />

                {unreadCount > 0 && (
                  <span className="shared-notification-count">
                    {unreadCount > 99
                      ? "99+"
                      : unreadCount}
                  </span>
                )}
              </button>
            )}

            <button
              className="shared-desktop-logout"
              type="button"
              onClick={handleLogout}
            >
              <HeaderIcon name="logout" />

              <span>
                {isJapanese
                  ? "ログアウト"
                  : "Log out"}
              </span>
            </button>

            <button
              className="shared-mobile-menu-button"
              type="button"
              aria-expanded={menuOpen}
              aria-controls="shared-mobile-navigation"
              aria-label={
                menuOpen
                  ? isJapanese
                    ? "メニューを閉じる"
                    : "Close menu"
                  : isJapanese
                    ? "メニューを開く"
                    : "Open menu"
              }
              onClick={() =>
                setMenuOpen((current) => !current)
              }
            >
              <HeaderIcon
                name={menuOpen ? "close" : "menu"}
              />
            </button>
          </div>
        </div>

        <div
          className={`shared-mobile-navigation ${
            menuOpen ? "open" : ""
          }`}
          id="shared-mobile-navigation"
          ref={mobileNavigationRef}
          aria-hidden={!menuOpen}
        >
          <nav aria-label={navigationLabel}>
            {navigationLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  isActive ? "active" : ""
                }
                onClick={closeMenu}
              >
                {isJapanese
                  ? link.ja
                  : link.en}
              </NavLink>
            ))}
          </nav>

          <div className="shared-mobile-navigation-footer">
            {isStudent && (
              <button
                type="button"
                onClick={() =>
                  handleNavigation("/notifications")
                }
              >
                <HeaderIcon name="bell" />

                <span>
                  {isJapanese
                    ? "通知"
                    : "Notifications"}
                </span>

                {unreadCount > 0 && (
                  <strong>
                    {unreadCount > 99
                      ? "99+"
                      : unreadCount}
                  </strong>
                )}
              </button>
            )}

            <button
              className="shared-mobile-logout"
              type="button"
              onClick={handleLogout}
            >
              <HeaderIcon name="logout" />

              <span>
                {isJapanese
                  ? "ログアウト"
                  : "Log out"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <button
          className="shared-mobile-backdrop"
          type="button"
          aria-label={
            isJapanese
              ? "メニューを閉じる"
              : "Close menu"
          }
          onClick={closeMenu}
        />
      )}
    </>
  );
}

export default DashboardHeader;
