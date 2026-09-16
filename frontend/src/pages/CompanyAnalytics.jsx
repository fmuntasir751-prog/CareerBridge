import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import api from "../services/api";

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
      } catch {
        setError(
          isJapanese
            ? "分析データを読み込めませんでした。"
            : "Could not load analytics data.",
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
        {isJapanese ? "読み込み中..." : "Loading..."}
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="page-loading">
        <div>
          <p>{error}</p>

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

  const { summary, jobs } = analytics;

  const summaryCards = [
    {
      label: isJapanese ? "投稿した求人" : "Total jobs",
      value: summary.total_jobs,
      icon: "💼",
    },
    {
      label: isJapanese ? "公開中の求人" : "Active jobs",
      value: summary.active_jobs,
      icon: "✅",
    },
    {
      label: isJapanese ? "応募者数" : "Applications",
      value: summary.total_applications,
      icon: "👥",
    },
    {
      label: isJapanese ? "採用者数" : "Accepted",
      value: summary.accepted_applications,
      icon: "🎉",
    },
  ];

  const statusData = [
    {
      key: "pending",
      label: isJapanese ? "応募済み" : "Pending",
      value: summary.pending_applications,
    },
    {
      key: "reviewing",
      label: isJapanese ? "選考中" : "Reviewing",
      value: summary.reviewing_applications,
    },
    {
      key: "interview",
      label: isJapanese ? "面接" : "Interview",
      value: summary.interview_applications,
    },
    {
      key: "accepted",
      label: isJapanese ? "採用" : "Accepted",
      value: summary.accepted_applications,
    },
    {
      key: "rejected",
      label: isJapanese ? "不採用" : "Rejected",
      value: summary.rejected_applications,
    },
    {
      key: "withdrawn",
      label: isJapanese ? "辞退" : "Withdrawn",
      value: summary.withdrawn_applications,
    },
  ];

  const totalApplications =
    summary.total_applications || 0;

  const maximumJobApplications = Math.max(
    ...jobs.map((job) => job.application_count),
    1,
  );

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
          ← {isJapanese ? "ダッシュボード" : "Dashboard"}
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
                ? "求人と応募状況を確認できます。"
                : "Track your jobs and application performance."}
            </p>
          </div>

          <button
            className="primary-button"
            type="button"
            onClick={() => navigate("/jobs/new")}
          >
            {isJapanese ? "求人を投稿" : "Post a job"}
          </button>
        </div>

        <div className="analytics-summary-grid">
          {summaryCards.map((card) => (
            <article
              className="analytics-summary-card"
              key={card.label}
            >
              <span>{card.icon}</span>

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
              {statusData.map((item) => {
                const percentage = totalApplications
                  ? Math.round(
                      (item.value / totalApplications) *
                        100,
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
                        className={`analytics-progress-bar status-${item.key}`}
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

          <section className="analytics-panel">
            <div className="analytics-panel-heading">
              <div>
                <h2>
                  {isJapanese
                    ? "求人の状態"
                    : "Job activity"}
                </h2>

                <p>
                  {isJapanese
                    ? "公開中と非公開の求人"
                    : "Active and inactive jobs"}
                </p>
              </div>
            </div>

            <div className="job-activity-chart">
              <article>
                <div
                  className="job-activity-circle active"
                  style={{
                    "--value": summary.total_jobs
                      ? `${
                          (summary.active_jobs /
                            summary.total_jobs) *
                          100
                        }%`
                      : "0%",
                  }}
                >
                  <strong>{summary.active_jobs}</strong>
                </div>

                <span>
                  {isJapanese ? "公開中" : "Active"}
                </span>
              </article>

              <article>
                <div
                  className="job-activity-circle inactive"
                  style={{
                    "--value": summary.total_jobs
                      ? `${
                          (summary.inactive_jobs /
                            summary.total_jobs) *
                          100
                        }%`
                      : "0%",
                  }}
                >
                  <strong>{summary.inactive_jobs}</strong>
                </div>

                <span>
                  {isJapanese ? "非公開" : "Inactive"}
                </span>
              </article>
            </div>
          </section>
        </div>

        <section className="analytics-panel job-performance-panel">
          <div className="analytics-panel-heading">
            <div>
              <h2>
                {isJapanese
                  ? "求人別の応募者数"
                  : "Applications by job"}
              </h2>

              <p>
                {isJapanese
                  ? "応募が多い求人を確認できます。"
                  : "See which jobs attract the most candidates."}
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
              const title =
                isJapanese && job.title_ja
                  ? job.title_ja
                  : job.title_en;

              const width =
                (job.application_count /
                  maximumJobApplications) *
                100;

              return (
                <article
                  className="job-performance-item"
                  key={job.id}
                >
                  <div className="job-performance-information">
                    <div>
                      <h3>{title}</h3>

                      <span
                        className={
                          job.is_active
                            ? "status-badge"
                            : "status-badge inactive"
                        }
                      >
                        {job.is_active
                          ? isJapanese
                            ? "公開中"
                            : "Active"
                          : isJapanese
                            ? "非公開"
                            : "Inactive"}
                      </span>
                    </div>

                    <strong>
                      {job.application_count}{" "}
                      {isJapanese
                        ? "件"
                        : job.application_count === 1
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
                ? "投稿した求人はまだありません。"
                : "You have not posted any jobs yet."}
            </p>
          )}
        </section>
      </section>
    </main>
  );
}

export default CompanyAnalytics;