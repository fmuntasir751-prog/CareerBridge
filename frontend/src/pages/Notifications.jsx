import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import api from "../services/api";

function Notifications() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

  const isJapanese = i18n.language.startsWith("ja");

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await api.get("/notifications/");
        setNotifications(response.data);
      } catch {
        setError(
          isJapanese
            ? "通知を読み込めませんでした。"
            : "Could not load notifications.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [isJapanese]);

  const markAsRead = async (notificationId) => {
    setUpdatingId(notificationId);
    setError("");

    try {
      const response = await api.patch(
        `/notifications/${notificationId}/read/`,
      );

      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) =>
          notification.id === notificationId
            ? response.data
            : notification,
        ),
      );
    } catch {
      setError(
        isJapanese
          ? "通知を更新できませんでした。"
          : "Could not update the notification.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const markAllAsRead = async () => {
    setError("");

    try {
      await api.patch("/notifications/read-all/");

      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) => ({
          ...notification,
          is_read: true,
        })),
      );
    } catch {
      setError(
        isJapanese
          ? "通知を更新できませんでした。"
          : "Could not update notifications.",
      );
    }
  };

  const openNotification = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    if (notification.job_id) {
      navigate(`/jobs/${notification.job_id}`);
    }
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read,
  ).length;

  if (loading) {
    return (
      <div className="page-loading">
        {isJapanese ? "読み込み中..." : "Loading..."}
      </div>
    );
  }

  return (
    <main className="notifications-page">
      <header className="dashboard-header">
        <a href="/" className="auth-brand">
          <span>CB</span>
          CareerBridge
        </a>

        <button
          type="button"
          onClick={() => navigate("/dashboard")}
        >
          ← {isJapanese ? "ダッシュボード" : "Dashboard"}
        </button>
      </header>

      <section className="notifications-content">
        <div className="notifications-heading">
          <div>
            <p className="eyebrow">
              {isJapanese ? "最新情報" : "Updates"}
            </p>

            <h1>
              {isJapanese ? "通知" : "Notifications"}
            </h1>

            <p>
              {isJapanese
                ? `未読通知：${unreadCount}件`
                : `${unreadCount} unread notification${
                    unreadCount === 1 ? "" : "s"
                  }`}
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              className="secondary-button"
              type="button"
              onClick={markAllAsRead}
            >
              {isJapanese
                ? "すべて既読にする"
                : "Mark all as read"}
            </button>
          )}
        </div>

        {error && (
          <div className="form-message error">
            {error}
          </div>
        )}

        <div className="notification-list">
          {notifications.map((notification) => {
            const title = isJapanese
              ? notification.title_ja
              : notification.title_en;

            const message = isJapanese
              ? notification.message_ja
              : notification.message_en;

            return (
              <article
                className={`notification-card ${
                  notification.is_read ? "read" : "unread"
                }`}
                key={notification.id}
              >
                <div className="notification-icon">
                  🔔
                </div>

                <div className="notification-information">
                  <div className="notification-title-row">
                    <h2>{title}</h2>

                    {!notification.is_read && (
                      <span className="unread-badge">
                        {isJapanese ? "未読" : "New"}
                      </span>
                    )}
                  </div>

                  <p>{message}</p>

                  <small>
                    {new Date(
                      notification.created_at,
                    ).toLocaleString(
                      isJapanese ? "ja-JP" : "en-US",
                    )}
                  </small>
                </div>

                <div className="notification-actions">
                  {!notification.is_read && (
                    <button
                      className="secondary-button"
                      type="button"
                      disabled={
                        updatingId === notification.id
                      }
                      onClick={() =>
                        markAsRead(notification.id)
                      }
                    >
                      {updatingId === notification.id
                        ? isJapanese
                          ? "処理中..."
                          : "Updating..."
                        : isJapanese
                          ? "既読にする"
                          : "Mark as read"}
                    </button>
                  )}

                  {notification.job_id && (
                    <button
                      className="primary-button"
                      type="button"
                      onClick={() =>
                        openNotification(notification)
                      }
                    >
                      {isJapanese
                        ? "求人を見る"
                        : "View job"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {!notifications.length && !error && (
          <div className="empty-message">
            <p>
              {isJapanese
                ? "通知はまだありません。"
                : "You do not have any notifications yet."}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

export default Notifications;