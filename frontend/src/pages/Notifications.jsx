import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import DashboardHeader from "../components/DashboardHeader";
import api, { getApiErrorMessage } from "../services/api";

const iconPaths = {
  general: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
  application: "M6 3h12v18H6zM9 8h6M9 12h6M9 16h4",
  job: "M5 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zM8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18",
  interview: "M4 5h16v12H8l-4 4V5zM8 9h8M8 13h5",
  unread: "M12 7v6M12 17h.01",
  read: "m8 12 3 3 5-6",
};

function NotificationIcon({ type = "general" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {(type === "read" || type === "unread") && (
        <circle cx="12" cy="12" r="9" />
      )}
      <path d={iconPaths[type] || iconPaths.general} />
    </svg>
  );
}

function getNotificationType(notification) {
  const type = notification.notification_type || notification.type || "";

  if (type.includes("interview")) return "interview";
  if (type.includes("application") || notification.application_id) {
    return "application";
  }
  if (type.includes("job") || notification.job_id) return "job";
  return "general";
}

function formatNotificationDate(value, isJapanese) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const minutes = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (minutes < 1) return isJapanese ? "たった今" : "Just now";
  if (minutes < 60) return isJapanese ? `${minutes}分前` : `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return isJapanese ? `${hours}時間前` : `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return isJapanese ? `${days}日前` : `${days}d ago`;

  return date.toLocaleString(isJapanese ? "ja-JP" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Notifications() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isJapanese = i18n.language.startsWith("ja");

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function loadNotifications() {
      try {
        const { data } = await api.get("/notifications/");
        const items = Array.isArray(data) ? data : data?.results;

        if (!Array.isArray(items)) {
          throw new Error("Invalid notifications response");
        }

        if (active) setNotifications(items);
      } catch (requestError) {
        if (active) setLoadError(requestError);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadNotifications();

    return () => {
      active = false;
    };
  }, []);

  const unreadCount = notifications.filter((item) => !item.is_read).length;
  const readCount = notifications.length - unreadCount;
  const busy = markingAll || updatingId !== null;
  const displayedError = loadError
    ? getApiErrorMessage(
        loadError,
        isJapanese
          ? "通知を読み込めませんでした。"
          : "Could not load notifications.",
      )
    : error;

  const filters = [
    {
      key: "all",
      label: isJapanese ? "すべて" : "All",
      summary: isJapanese ? "すべての通知" : "Total notifications",
      count: notifications.length,
    },
    {
      key: "unread",
      label: isJapanese ? "未読" : "Unread",
      count: unreadCount,
    },
    {
      key: "read",
      label: isJapanese ? "既読" : "Read",
      count: readCount,
    },
  ];

  const filteredNotifications = notifications.filter((item) => {
    if (activeFilter === "unread") return !item.is_read;
    if (activeFilter === "read") return item.is_read;
    return true;
  });

  async function markAsRead(id, showSuccess = true) {
    if (busy) return false;

    setError("");
    setSuccess("");
    setUpdatingId(id);

    try {
      await api.patch(`/notifications/${id}/read/`);
      setNotifications((current) =>
        current.map((item) => (
          item.id === id ? { ...item, is_read: true } : item
        )),
      );

      if (showSuccess) {
        setSuccess(isJapanese ? "通知を既読にしました。" : "Notification marked as read.");
      }
      return true;
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          isJapanese ? "通知を更新できませんでした。" : "Could not update the notification.",
        ),
      );
      return false;
    } finally {
      setUpdatingId(null);
    }
  }

  async function markAllAsRead() {
    if (busy || unreadCount === 0) return;

    setError("");
    setSuccess("");
    setMarkingAll(true);

    try {
      await api.patch("/notifications/read-all/");
      setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
      setSuccess(
        isJapanese ? "すべての通知を既読にしました。" : "All notifications were marked as read.",
      );
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          isJapanese ? "通知を更新できませんでした。" : "Could not update notifications.",
        ),
      );
    } finally {
      setMarkingAll(false);
    }
  }

  async function openNotification(notification) {
    if (!notification.is_read && !(await markAsRead(notification.id, false))) {
      return;
    }

    if (notification.job_id) {
      navigate(`/jobs/${notification.job_id}`);
    } else if (notification.application_id) {
      navigate("/applications");
    }
  }

  if (loading) {
    return (
      <div className="page-loading" role="status">
        {isJapanese ? "読み込み中..." : "Loading..."}
      </div>
    );
  }

  const count = filteredNotifications.length;

  return (
    <main className="notifications-page professional-notifications-page">
      <DashboardHeader role="student" unreadCount={unreadCount} />

      <section className="notifications-content">
        <div className="notifications-heading">
          <div>
            <p className="eyebrow">{isJapanese ? "最新情報" : "Updates"}</p>
            <h1>{isJapanese ? "通知" : "Notifications"}</h1>
            <p>
              {isJapanese
                ? "応募状況や求人に関する最新情報を確認できます。"
                : "Stay updated on your applications and job activity."}
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              className="secondary-button"
              type="button"
              disabled={busy}
              onClick={markAllAsRead}
            >
              {markingAll
                ? isJapanese ? "更新中..." : "Updating..."
                : isJapanese ? "すべて既読にする" : "Mark all as read"}
            </button>
          )}
        </div>

        {displayedError && (
          <div className="form-message error" role="alert">{displayedError}</div>
        )}
        {success && (
          <div className="form-message success" role="status">{success}</div>
        )}

        {!loadError && (
          <section className="notification-summary-grid">
            {filters.map(({ key, label, summary, count: total }) => (
              <article key={key}>
                <span className={`notification-summary-icon ${key}`} aria-hidden="true">
                  <NotificationIcon type={key === "all" ? "general" : key} />
                </span>
                <div>
                  <small>{summary || label}</small>
                  <strong>{total}</strong>
                </div>
              </article>
            ))}
          </section>
        )}

        {notifications.length > 0 && (
          <div className="notification-toolbar">
            <div
              className="notification-filters"
              role="group"
              aria-label={isJapanese ? "通知フィルター" : "Notification filters"}
            >
              {filters.map((filter) => (
                <button
                  key={filter.key}
                  className={activeFilter === filter.key ? "active" : ""}
                  type="button"
                  aria-pressed={activeFilter === filter.key}
                  onClick={() => setActiveFilter(filter.key)}
                >
                  {filter.label}
                  <span>{filter.count}</span>
                </button>
              ))}
            </div>
            <p>
              {isJapanese ? `${count}件` : `${count} ${count === 1 ? "notification" : "notifications"}`}
            </p>
          </div>
        )}

        {count > 0 ? (
          <div className="professional-notification-list">
            {filteredNotifications.map((notification) => {
              const { id, is_read, job_id, application_id, created_at } = notification;
              const title = isJapanese
                ? notification.title_ja || notification.title_en
                : notification.title_en || notification.title_ja;
              const message = isJapanese
                ? notification.message_ja || notification.message_en
                : notification.message_en || notification.message_ja;
              const type = getNotificationType(notification);

              return (
                <article
                  className={`professional-notification-card ${is_read ? "read" : "unread"}`}
                  key={id}
                >
                  <div className={`professional-notification-icon ${type}`}>
                    <NotificationIcon type={type} />
                  </div>

                  <div className="professional-notification-information">
                    <div className="professional-notification-title">
                      <div>
                        {!is_read && (
                          <span className="notification-new-indicator">
                            {isJapanese ? "新着" : "New"}
                          </span>
                        )}
                        <h2>{title}</h2>
                      </div>
                      <time dateTime={created_at}>
                        {formatNotificationDate(created_at, isJapanese)}
                      </time>
                    </div>
                    <p>{message}</p>
                  </div>

                  <div className="professional-notification-actions">
                    {!is_read && (
                      <button
                        className="notification-read-button"
                        type="button"
                        disabled={busy}
                        onClick={() => markAsRead(id)}
                      >
                        {updatingId === id
                          ? isJapanese ? "更新中..." : "Updating..."
                          : isJapanese ? "既読にする" : "Mark as read"}
                      </button>
                    )}

                    {Boolean(job_id || application_id) && (
                      <button
                        className="primary-button"
                        type="button"
                        disabled={busy}
                        onClick={() => openNotification(notification)}
                      >
                        {job_id
                          ? isJapanese ? "求人を見る" : "View job"
                          : isJapanese ? "応募を見る" : "View application"}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : !loadError && (
          <section className="notifications-empty-state">
            <span><NotificationIcon /></span>
            {notifications.length > 0 ? (
              <>
                <h2>
                  {isJapanese
                    ? "このフィルターに通知はありません"
                    : "No notifications in this filter"}
                </h2>
                <p>
                  {isJapanese
                    ? "別のフィルターを選択してください。"
                    : "Choose another notification filter."}
                </p>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setActiveFilter("all")}
                >
                  {isJapanese ? "すべて表示" : "Show all"}
                </button>
              </>
            ) : (
              <>
                <h2>{isJapanese ? "通知はまだありません" : "No notifications yet"}</h2>
                <p>
                  {isJapanese
                    ? "応募状況が更新されると、ここに通知が表示されます。"
                    : "Updates about your applications and jobs will appear here."}
                </p>
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => navigate("/dashboard")}
                >
                  {isJapanese ? "ダッシュボードへ戻る" : "Back to dashboard"}
                </button>
              </>
            )}
          </section>
        )}
      </section>
    </main>
  );
}

export default Notifications;