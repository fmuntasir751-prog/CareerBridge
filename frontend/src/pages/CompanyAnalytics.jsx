import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import api, {
  getApiErrorMessage,
} from "../services/api";

function CompanyAnalytics() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isJapanese = i18n.language.startsWith("ja");

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const response = await api.get(
          "/jobs/analytics/",
        );

        setAnalytics(response.data);
      } catch (requestError) {
        setError(
          getApiErrorMessage(
            requestError,
            isJapanese
              ? "分析データを読み込めませんでした。"
              : "Could not load analytics data.",
          ),
        );
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [isJapanese]);

  if (loading) {
    return (
      <div className="page-loading">
        {isJapanese
          ? "読み込み中..."
          : "Loading..."}
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="page-loading">
        <div>
          <p>
            {error || (
              isJapanese
                ? "分析データがありません。"
                : "Analytics data is unavailable."
            )}
          </p>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
          >
            {isJapanese
              ? "ダッシュボードに戻る"
              : "Back to dashboard"}
          </button>
        </div>
      </div>
    );
  }

  const summary = analytics.summary || {};
  const jobs = analytics.jobs || [];

  const totalJobs = summary.total_jobs || 0;

  const publishedJobs = (
    summary.published_jobs
    ?? summary.active_jobs
    ?? 0
  );

  const draftJobs = summary.draft_jobs || 0;
  const closedJobs = summary.closed_jobs || 0;
  const expiredJobs = summary.expired_jobs || 0;

  const totalApplications = (
    summary.total_applications || 0
  );

  const summaryCards = [
    {
      label: isJapanese
        ? "投稿した求人"
        : "Total jobs",
      value: totalJobs,
      icon: "💼",
    },
    {
      label: isJapanese
        ? "公開中の求人"
        : "Published jobs",
      value: publishedJobs,
      icon: "✅",
    },
    {
      label: isJapanese
        ? "応募者数"
        : "Applications",
      value: totalApplications,
      icon: "👥",
    },
    {
      label: isJapanese
        ? "採用者数"
        : "Accepted",
      value: (
        summary.accepted_applications || 0
      ),
      icon: "🎉",
    },
  ];

  const applicationStatusData = [
    {
      key: "pending",
      label: isJapanese
        ? "応募済み"
        : "Pending",
      value: (
        summary.pending_applications || 0
      ),
    },
    {
      key: "reviewing",
      label: isJapanese
        ? "選考中"
        : "Reviewing",
      value: (
        summary.reviewing_applications || 0
      ),
    },
    {
      key: "interview",
      label: isJapanese
        ? "面接"
        : "Interview",
      value: (
        summary.interview_applications || 0
      ),
    },
    {
      key: "accepted",
      label: isJapanese
        ? "採用"
        : "Accepted",
      value: (
        summary.accepted_applications || 0
      ),
    },
    {
      key: "rejected",
      label: isJapanese
        ? "不採用"
        : "Rejected",
      value: (
        summary.rejected_applications || 0
      ),
    },
    {
      key: "withdrawn",
      label: isJapanese
        ? "辞退"
        : "Withdrawn",
      value: (
        summary.withdrawn_applications || 0
      ),
    },
  ];

  const jobLifecycleData = [
    {
      key: "published",
      label: isJapanese
        ? "公開中"
        : "Published",
      value: publishedJobs,
    },
    {
      key: "draft",
      label: isJapanese
        ? "下書き"
        : "Draft",
      value: draftJobs,
    },
    {
      key: "closed",
      label: isJapanese
        ? "終了"
        : "Closed",
      value: closedJobs,
    },
    {
      key: "expired",
      label: isJapanese
        ? "期限切れ"
        : "Expired",
      value: expiredJobs,
    },
  ];

  const maximumJobApplications = Math.max(
    ...jobs.map(
      (job) => job.application_count || 0,
    ),
    1,
  );

  const getLifecycleLabel = (lifecycleStatus) => {
    const labels = {
      draft: isJapanese ? "下書き" : "Draft",
      published: isJapanese
        ? "公開中"
        : "Published",
      closed: isJapanese ? "終了" : "Closed",
      expired: isJapanese
        ? "期限切れ"
        : "Expired",
    };

    return (
      labels[lifecycleStatus]
      || lifecycleStatus
    );
  };

  const getEffectiveStatus = (job) => {
    if (job.effective_status) {
      return job.effective_status;
    }

    if (job.status) {
      return job.status;
    }

    return job.is_active
      ? "published"
      : "closed";
  };

  return (
    <main className="analytics-page">
      <header className="dashboard-header">
        <a href="/" className="auth-brand">
          <span>CB</span>
          CareerBridge
        </a>

        <button
          type="button"
          onClick={() => navigate("/dashboard")}
        >
          ←{" "}
          {isJapanese
            ? "ダッシュボード"
            : "Dashboard"}
        </button>
      </header>

      <section className="analytics-content">
        <p className="eyebrow">
          {isJapanese
            ? "採用パフォーマンス"
            : "Recruitment performance"}
        </p>

        <div className="analytics-title-row">
          <div>
            <h1>
              {isJapanese
                ? "採用分析"
                : "Company analytics"}
            </h1>

            <p>
              {isJapanese
                ? (
                  "求人の公開状況と応募状況を"
                  + "確認できます。"
                )
                : (
                  "Track job lifecycle and "
                  + "application performance."
                )}
            </p>
          </div>

          <button
            className="primary-button"
            type="button"
            onClick={() => navigate("/jobs/new")}
          >
            {isJapanese
              ? "求人を作成"
              : "Create a job"}
          </button>
        </div>

        <div className="analytics-summary-grid">
          {summaryCards.map((card) => (
            <article
              className="analytics-summary-card"
              key={card.label}
            >
              <span aria-hidden="true">
                {card.icon}
              </span>

              <div>
                <small>{card.label}</small>
                <strong>{card.value}</strong>
              </div>
            </article>
          ))}
        </div>

        <div className="analytics-grid">
          <section className="analytics-panel">
            <div className="analytics-panel-heading">
              <div>
                <h2>
                  {isJapanese
                    ? "応募ステータス"
                    : "Application status"}
                </h2>

                <p>
                  {isJapanese
                    ? "現在の応募者の内訳"
                    : "Current candidate breakdown"}
                </p>
              </div>

              <strong>{totalApplications}</strong>
            </div>

            <div className="status-analytics-list">
              {applicationStatusData.map(
                (item) => {
                  const percentage =
                    totalApplications
                      ? Math.round(
                          (
                            item.value
                            / totalApplications
                          ) * 100,
                        )
                      : 0;

                  return (
                    <div
                      className="status-analytics-item"
                      key={item.key}
                    >
                      <div>
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                      </div>

                      <div className="analytics-progress">
                        <span
                          className={
                            `analytics-progress-bar `
                            + `status-${item.key}`
                          }
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>

                      <small>{percentage}%</small>
                    </div>
                  );
                },
              )}
            </div>
          </section>

          <section className="analytics-panel">
            <div className="analytics-panel-heading">
              <div>
                <h2>
                  {isJapanese
                    ? "求人ライフサイクル"
                    : "Job lifecycle"}
                </h2>

                <p>
                  {isJapanese
                    ? (
                      "下書き、公開中、終了、"
                      + "期限切れの内訳"
                    )
                    : (
                      "Draft, published, closed "
                      + "and expired jobs"
                    )}
                </p>
              </div>

              <strong>{totalJobs}</strong>
            </div>

            <div className="status-analytics-list">
              {jobLifecycleData.map((item) => {
                const percentage = totalJobs
                  ? Math.round(
                      (
                        item.value
                        / totalJobs
                      ) * 100,
                    )
                  : 0;

                return (
                  <div
                    className="status-analytics-item"
                    key={item.key}
                  >
                    <div>
                      <span
                        className={
                          `job-lifecycle-badge `
                          + item.key
                        }
                      >
                        {item.label}
                      </span>

                      <strong>{item.value}</strong>
                    </div>

                    <div className="analytics-progress">
                      <span
                        className={
                          `analytics-progress-bar `
                          + `lifecycle-${item.key}`
                        }
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>

                    <small>{percentage}%</small>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <section
          className={
            "analytics-panel "
            + "job-performance-panel"
          }
        >
          <div className="analytics-panel-heading">
            <div>
              <h2>
                {isJapanese
                  ? "求人別の応募者数"
                  : "Applications by job"}
              </h2>

              <p>
                {isJapanese
                  ? (
                    "求人ごとの公開状態と応募数を"
                    + "確認できます。"
                  )
                  : (
                    "Compare lifecycle status "
                    + "and candidate activity."
                  )}
              </p>
            </div>

            <button
              className="secondary-button"
              type="button"
              onClick={() => navigate("/my-jobs")}
            >
              {isJapanese
                ? "求人を管理"
                : "Manage jobs"}
            </button>
          </div>

          <div className="job-performance-list">
            {jobs.map((job) => {
              const title = (
                isJapanese && job.title_ja
                  ? job.title_ja
                  : job.title_en
              );

              const applicationCount = (
                job.application_count || 0
              );

              const width = (
                applicationCount
                / maximumJobApplications
              ) * 100;

              const lifecycleStatus = (
                getEffectiveStatus(job)
              );

              return (
                <article
                  className="job-performance-item"
                  key={job.id}
                >
                  <div
                    className={
                      "job-performance-information"
                    }
                  >
                    <div>
                      <h3>{title}</h3>

                      <span
                        className={
                          `job-lifecycle-badge `
                          + lifecycleStatus
                        }
                      >
                        {
                          getLifecycleLabel(
                            lifecycleStatus,
                          )
                        }
                      </span>
                    </div>

                    <strong>
                      {applicationCount}{" "}
                      {isJapanese
                        ? "件"
                        : applicationCount === 1
                          ? "application"
                          : "applications"}
                    </strong>
                  </div>

                  <div className="job-performance-bar">
                    <span
                      style={{
                        width: `${width}%`,
                      }}
                    />
                  </div>
                </article>
              );
            })}
          </div>

          {!jobs.length && (
            <p className="empty-message">
              {isJapanese
                ? (
                  "作成した求人は"
                  + "まだありません。"
                )
                : (
                  "You have not created "
                  + "any jobs yet."
                )}
            </p>
          )}
        </section>
      </section>
    </main>
  );
}

export default CompanyAnalytics;