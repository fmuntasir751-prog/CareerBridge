import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import api, {
  getApiErrorMessage,
} from "../services/api";

function MyJobs() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] =
    useState(null);
  const [error, setError] = useState("");

  const isJapanese = i18n.language.startsWith("ja");

  const statusLabels = {
    draft: isJapanese ? "下書き" : "Draft",
    published: isJapanese ? "公開中" : "Published",
    closed: isJapanese ? "終了" : "Closed",
    expired: isJapanese
      ? "募集期限終了"
      : "Expired",
  };

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const response = await api.get(
          "/jobs/mine/",
        );

        setJobs(response.data);
      } catch (requestError) {
        setError(
          getApiErrorMessage(
            requestError,
            t("myJobsLoadError"),
          ),
        );
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, [t]);

  const updateJobStatus = async (
    job,
    nextStatus,
  ) => {
    setError("");
    setUpdatingId(job.id);

    try {
      const response = await api.patch(
        `/jobs/${job.id}/`,
        {
          status: nextStatus,
        },
      );

      setJobs((currentJobs) =>
        currentJobs.map((currentJob) =>
          currentJob.id === job.id
            ? response.data
            : currentJob,
        ),
      );
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          t("jobUpdateError"),
        ),
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteJob = async (jobId) => {
    const confirmed = window.confirm(
      t("deleteJobConfirmation"),
    );

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      await api.delete(`/jobs/${jobId}/`);

      setJobs((currentJobs) =>
        currentJobs.filter(
          (job) => job.id !== jobId,
        ),
      );
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          t("jobDeleteError"),
        ),
      );
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        {t("loading")}
      </div>
    );
  }

  return (
    <main className="applications-page">
      <header className="dashboard-header">
        <a href="/" className="auth-brand">
          <span>CB</span>
          CareerBridge
        </a>

        <button
          type="button"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          ← {t("dashboard")}
        </button>
      </header>

      <section className="applications-content">
        <p className="eyebrow">
          {t("recruitment")}
        </p>

        <h1>{t("myPostedJobs")}</h1>

        <div className="dashboard-actions">
          <a
            className="primary-button"
            href="/jobs/new"
          >
            {t("postJob")}
          </a>
        </div>

        {error && (
          <div className="form-message error">
            {error}
          </div>
        )}

        <div className="application-list">
          {jobs.map((job) => {
            const title =
              isJapanese && job.title_ja
                ? job.title_ja
                : job.title_en;

            const effectiveStatus =
              job.effective_status
              || job.status
              || (
                job.is_active
                  ? "published"
                  : "closed"
              );

            const isUpdating =
              updatingId === job.id;

            return (
              <article
                className="application-card"
                key={job.id}
              >
                <div>
                  <span
                    className={`job-lifecycle-badge ${effectiveStatus}`}
                  >
                    {statusLabels[effectiveStatus]
                      || effectiveStatus}
                  </span>

                  <h2>{title}</h2>
                  <p>{job.location}</p>

                  {job.deadline && (
                    <p className="job-deadline-text">
                      {isJapanese
                        ? "応募締切"
                        : "Application deadline"}
                      :{" "}
                      {new Date(
                        `${job.deadline}T00:00:00`,
                      ).toLocaleDateString(
                        isJapanese
                          ? "ja-JP"
                          : "en-US",
                      )}
                    </p>
                  )}

                  <small>
                    {new Date(
                      job.created_at,
                    ).toLocaleDateString(
                      isJapanese
                        ? "ja-JP"
                        : "en-US",
                    )}
                  </small>
                </div>

                <div className="job-management-actions">
                  <a
                    className="secondary-button"
                    href={`/jobs/${job.id}/edit`}
                  >
                    {t("editJob")}
                  </a>

                  {effectiveStatus
                    === "published" && (
                    <a
                      className="secondary-button"
                      href={`/jobs/${job.id}`}
                    >
                      {t("viewDetails")}
                    </a>
                  )}

                  {effectiveStatus === "draft" && (
                    <button
                      className="status-button"
                      type="button"
                      disabled={isUpdating}
                      onClick={() =>
                        updateJobStatus(
                          job,
                          "published",
                        )
                      }
                    >
                      {isUpdating
                        ? isJapanese
                          ? "公開中..."
                          : "Publishing..."
                        : isJapanese
                          ? "公開"
                          : "Publish"}
                    </button>
                  )}

                  {effectiveStatus
                    === "published" && (
                    <button
                      className="job-close-button"
                      type="button"
                      disabled={isUpdating}
                      onClick={() =>
                        updateJobStatus(
                          job,
                          "closed",
                        )
                      }
                    >
                      {isJapanese
                        ? "募集を終了"
                        : "Close job"}
                    </button>
                  )}

                  {effectiveStatus === "closed" && (
                    <button
                      className="status-button"
                      type="button"
                      disabled={isUpdating}
                      onClick={() =>
                        updateJobStatus(
                          job,
                          "published",
                        )
                      }
                    >
                      {isJapanese
                        ? "再公開"
                        : "Republish"}
                    </button>
                  )}

                  {effectiveStatus === "expired" && (
                    <button
                      className="status-button"
                      type="button"
                      onClick={() =>
                        navigate(
                          `/jobs/${job.id}/edit`,
                        )
                      }
                    >
                      {isJapanese
                        ? "締切日を更新"
                        : "Update deadline"}
                    </button>
                  )}

                  <button
                    className="delete-button"
                    type="button"
                    onClick={() =>
                      deleteJob(job.id)
                    }
                  >
                    {t("delete")}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {!jobs.length && !error && (
          <p className="empty-message">
            {t("noPostedJobs")}
          </p>
        )}
      </section>
    </main>
  );
}

export default MyJobs;