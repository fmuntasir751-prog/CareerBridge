import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import api, {
  getApiErrorMessage,
} from "../services/api";

function Notifications() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  const isJapanese =
    i18n.language.startsWith("ja");

  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [
    updatingId,
    setUpdatingId,
  ] = useState(null);

  const [
    markingAll,
    setMarkingAll,
  ] = useState(false);

  const [activeFilter, setActiveFilter] =
    useState("all");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await api.get(
          "/notifications/",
        );

        setNotifications(response.data);
      } catch (requestError) {
        setError(
          getApiErrorMessage(
            requestError,
            isJapanese
              ? "通知を読み込めませんでした。"
              : "Could not load notifications.",
          ),
        );
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [isJapanese]);

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.is_read,
    ).length;

  const readCount =
    notifications.length - unreadCount;

  const filteredNotifications =
    useMemo(() => {
      if (activeFilter === "unread") {
        return notifications.filter(
          (notification) =>
            !notification.is_read,
        );
      }

      if (activeFilter === "read") {
        return notifications.filter(
          (notification) =>
            notification.is_read,
        );
      }

      return notifications;
    }, [
      activeFilter,
      notifications,
    ]);

  const markAsRead = async (
    notificationId,
    showSuccess = true,
  ) => {
    setUpdatingId(notificationId);
    setError("");
    setSuccess("");

    try {
      const response = await api.patch(
        `/notifications/${notificationId}/read/`,
      );

      setNotifications(
        (currentNotifications) =>
          currentNotifications.map(
            (notification) =>
              notification.id ===
              notificationId
                ? response.data
                : notification,
          ),
      );

      if (showSuccess) {
        setSuccess(
          isJapanese
            ? "通知を既読にしました。"
            : "Notification marked as read.",
        );
      }

      return true;
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          isJapanese
            ? "通知を更新できませんでした。"
            : "Could not update the notification.",
        ),
      );

      return false;
    } finally {
      setUpdatingId(null);
    }
  };

  const markAllAsRead = async () => {
    setError("");
    setSuccess("");
    setMarkingAll(true);

    try {
      await api.patch(
        "/notifications/read-all/",
      );

      setNotifications(
        (currentNotifications) =>
          currentNotifications.map(
            (notification) => ({
              ...notification,
              is_read: true,
            }),
          ),
      );

      setSuccess(
        isJapanese
          ? "すべての通知を既読にしました。"
          : "All notifications were marked as read.",
      );
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          isJapanese
            ? "通知を更新できませんでした。"
            : "Could not update notifications.",
        ),
      );
    } finally {
      setMarkingAll(false);
    }
  };

  const openNotification = async (
    notification,
  ) => {
    if (!notification.is_read) {
      await markAsRead(
        notification.id,
        false,
      );
    }

    if (notification.job_id) {
      navigate(
        `/jobs/${notification.job_id}`,
      );
      return;
    }

    if (notification.application_id) {
      navigate("/applications");
    }
  };

  const formatNotificationDate = (
    dateValue,
  ) => {
    const date = new Date(dateValue);
    const now = new Date();

    const difference =
      now.getTime() - date.getTime();

    const minutes = Math.floor(
      difference / (1000 * 60),
    );

    const hours = Math.floor(
      difference / (1000 * 60 * 60),
    );

    const days = Math.floor(
      difference /
      (1000 * 60 * 60 * 24),
    );

    if (minutes < 1) {
      return isJapanese
        ? "たった今"
        : "Just now";
    }

    if (minutes < 60) {
      return isJapanese
        ? `${minutes}分前`
        : `${minutes}m ago`;
    }

    if (hours < 24) {
      return isJapanese
        ? `${hours}時間前`
        : `${hours}h ago`;
    }

    if (days < 7) {
      return isJapanese
        ? `${days}日前`
        : `${days}d ago`;
    }

    return date.toLocaleString(
      isJapanese
        ? "ja-JP"
        : "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    );
  };

  const getNotificationType = (
    notification,
  ) => {
    const type =
      notification.notification_type ||
      notification.type ||
      "";

    if (
      type.includes("application") ||
      notification.application_id
    ) {
      return "application";
    }

    if (
      type.includes("job") ||
      notification.job_id
    ) {
      return "job";
    }

    if (
      type.includes("interview")
    ) {
      return "interview";
    }

    return "general";
  };

  const renderNotificationIcon = (
    type,
  ) => {
    if (type === "application") {
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path d="M6 3h12v18H6z" />
          <path d="M9 8h6" />
          <path d="M9 12h6" />
          <path d="M9 16h4" />
        </svg>
      );
    }

    if (type === "job") {
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <rect
            x="3"
            y="7"
            width="18"
            height="13"
            rx="2"
          />
          <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
          <path d="M3 12h18" />
        </svg>
      );
    }

    if (type === "interview") {
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <path d="M4 5h16v12H8l-4 4V5z" />
          <path d="M8 9h8" />
          <path d="M8 13h5" />
        </svg>
      );
    }

    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
      >
        <path d="M18 8a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="page-loading">
        {isJapanese
          ? "読み込み中..."
          : "Loading..."}
      </div>
    );
  }

  const filters = [
    {
      key: "all",
      label: isJapanese
        ? "すべて"
        : "All",
      count: notifications.length,
    },
    {
      key: "unread",
      label: isJapanese
        ? "未読"
        : "Unread",
      count: unreadCount,
    },
    {
      key: "read",
      label: isJapanese
        ? "既読"
        : "Read",
      count: readCount,
    },
  ];

  return (
    <main className="notifications-page professional-notifications-page">
      <header className="dashboard-header">
        <a
          href="/"
          className="auth-brand"
        >
          <span>CB</span>
          CareerBridge
        </a>

        <button
          type="button"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          ←{" "}
          {isJapanese
            ? "ダッシュボード"
            : "Dashboard"}
        </button>
      </header>

      <section className="notifications-content">
        <div className="notifications-heading">
          <div>
            <p className="eyebrow">
              {isJapanese
                ? "最新情報"
                : "Updates"}
            </p>

            <h1>
              {isJapanese
                ? "通知"
                : "Notifications"}
            </h1>

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
              disabled={markingAll}
              onClick={markAllAsRead}
            >
              {markingAll
                ? (
                  isJapanese
                    ? "更新中..."
                    : "Updating..."
                )
                : (
                  isJapanese
                    ? "すべて既読にする"
                    : "Mark all as read"
                )}
            </button>
          )}
        </div>

        {error && (
          <div
            className="form-message error"
            role="alert"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="form-message success"
            role="status"
          >
            {success}
          </div>
        )}

        <section className="notification-summary-grid">
          <article>
            <span
              className="notification-summary-icon all"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path d="M18 8a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                <path d="M10 21h4" />
              </svg>
            </span>

            <div>
              <small>
                {isJapanese
                  ? "すべての通知"
                  : "Total notifications"}
              </small>

              <strong>
                {notifications.length}
              </strong>
            </div>
          </article>

          <article>
            <span
              className="notification-summary-icon unread"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                />
                <path d="M12 7v6" />
                <path d="M12 17h.01" />
              </svg>
            </span>

            <div>
              <small>
                {isJapanese
                  ? "未読"
                  : "Unread"}
              </small>

              <strong>
                {unreadCount}
              </strong>
            </div>
          </article>

          <article>
            <span
              className="notification-summary-icon read"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                />
                <path d="M8 12l3 3 5-6" />
              </svg>
            </span>

            <div>
              <small>
                {isJapanese
                  ? "既読"
                  : "Read"}
              </small>

              <strong>
                {readCount}
              </strong>
            </div>
          </article>
        </section>

        {notifications.length > 0 && (
          <div className="notification-toolbar">
            <div
              className="notification-filters"
              role="group"
              aria-label={
                isJapanese
                  ? "通知フィルター"
                  : "Notification filters"
              }
            >
              {filters.map((filter) => (
                <button
                  className={
                    activeFilter ===
                    filter.key
                      ? "active"
                      : ""
                  }
                  type="button"
                  key={filter.key}
                  onClick={() =>
                    setActiveFilter(
                      filter.key,
                    )
                  }
                >
                  {filter.label}

                  <span>
                    {filter.count}
                  </span>
                </button>
              ))}
            </div>

            <p>
              {isJapanese
                ? `${filteredNotifications.length}件`
                : (
                  `${filteredNotifications.length} ${
                    filteredNotifications.length ===
                    1
                      ? "notification"
                      : "notifications"
                  }`
                )}
            </p>
          </div>
        )}

        {filteredNotifications.length >
        0 ? (
          <div className="professional-notification-list">
            {filteredNotifications.map(
              (notification) => {
                const title =
                  isJapanese
                    ? (
                      notification.title_ja ||
                      notification.title_en
                    )
                    : (
                      notification.title_en ||
                      notification.title_ja
                    );

                const message =
                  isJapanese
                    ? (
                      notification.message_ja ||
                      notification.message_en
                    )
                    : (
                      notification.message_en ||
                      notification.message_ja
                    );

                const type =
                  getNotificationType(
                    notification,
                  );

                const isUpdating =
                  updatingId ===
                  notification.id;

                const hasDestination =
                  notification.job_id ||
                  notification.application_id;

                return (
                  <article
                    className={
                      `professional-notification-card ${
                        notification.is_read
                          ? "read"
                          : "unread"
                      }`
                    }
                    key={notification.id}
                  >
                    <div
                      className={
                        `professional-notification-icon ${type}`
                      }
                      aria-hidden="true"
                    >
                      {renderNotificationIcon(
                        type,
                      )}
                    </div>

                    <div className="professional-notification-information">
                      <div className="professional-notification-title">
                        <div>
                          {!notification.is_read && (
                            <span className="notification-new-indicator">
                              {isJapanese
                                ? "新着"
                                : "New"}
                            </span>
                          )}

                          <h2>{title}</h2>
                        </div>

                        <time
                          dateTime={
                            notification.created_at
                          }
                        >
                          {formatNotificationDate(
                            notification.created_at,
                          )}
                        </time>
                      </div>

                      <p>{message}</p>
                    </div>

                    <div className="professional-notification-actions">
                      {!notification.is_read && (
                        <button
                          className="notification-read-button"
                          type="button"
                          disabled={isUpdating}
                          onClick={() =>
                            markAsRead(
                              notification.id,
                            )
                          }
                        >
                          {isUpdating
                            ? (
                              isJapanese
                                ? "更新中..."
                                : "Updating..."
                            )
                            : (
                              isJapanese
                                ? "既読にする"
                                : "Mark as read"
                            )}
                        </button>
                      )}

                      {hasDestination && (
                        <button
                          className="primary-button"
                          type="button"
                          disabled={isUpdating}
                          onClick={() =>
                            openNotification(
                              notification,
                            )
                          }
                        >
                          {notification.job_id
                            ? (
                              isJapanese
                                ? "求人を見る"
                                : "View job"
                            )
                            : (
                              isJapanese
                                ? "応募を見る"
                                : "View application"
                            )}
                        </button>
                      )}
                    </div>
                  </article>
                );
              },
            )}
          </div>
        ) : notifications.length > 0 ? (
          <section className="notifications-empty-state">
            <span aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path d="M18 8a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                <path d="M10 21h4" />
              </svg>
            </span>

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
              onClick={() =>
                setActiveFilter("all")
              }
            >
              {isJapanese
                ? "すべて表示"
                : "Show all"}
            </button>
          </section>
        ) : (
          <section className="notifications-empty-state">
            <span aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path d="M18 8a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                <path d="M10 21h4" />
              </svg>
            </span>

            <h2>
              {isJapanese
                ? "通知はまだありません"
                : "No notifications yet"}
            </h2>

            <p>
              {isJapanese
                ? "応募状況が更新されると、ここに通知が表示されます。"
                : "Updates about your applications and jobs will appear here."}
            </p>

            <button
              className="primary-button"
              type="button"
              onClick={() =>
                navigate("/dashboard")
              }
            >
              {isJapanese
                ? "ダッシュボードへ戻る"
                : "Back to dashboard"}
            </button>
          </section>
        )}
      </section>
    </main>
  );
}

export default Notifications;