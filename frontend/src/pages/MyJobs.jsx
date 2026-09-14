import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import api from "../services/api";

function MyJobs() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isJapanese = i18n.language.startsWith("ja");

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const response = await api.get("/jobs/mine/");
        setJobs(response.data);
      } catch {
        setError(t("myJobsLoadError"));
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, [t]);

  const toggleJobStatus = async (job) => {
    setError("");

    try {
      const response = await api.patch(
        `/jobs/${job.id}/`,
        {
          is_active: !job.is_active,
        },
      );

      setJobs((currentJobs) =>
        currentJobs.map((currentJob) =>
          currentJob.id === job.id
            ? response.data
            : currentJob,
        ),
      );
    } catch {
      setError(t("jobUpdateError"));
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
        currentJobs.filter((job) => job.id !== jobId),
      );
    } catch {
      setError(t("jobDeleteError"));
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
          onClick={() => navigate("/dashboard")}
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

            return (
              <article
                className="application-card"
                key={job.id}
              >
                <div>
                  <span
                    className={
                      job.is_active
                        ? "status-badge"
                        : "status-badge inactive"
                    }
                  >
                    {job.is_active
                      ? t("active")
                      : t("inactive")}
                  </span>

                  <h2>{title}</h2>
                  <p>{job.location}</p>

                  <small>
                    {new Date(
                      job.created_at,
                    ).toLocaleDateString(
                      isJapanese ? "ja-JP" : "en-US",
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

                  <a
                    className="secondary-button"
                    href={`/jobs/${job.id}`}
                  >
                    {t("viewDetails")}
                  </a>

                  <button
                    className="status-button"
                    type="button"
                    onClick={() => toggleJobStatus(job)}
                  >
                    {job.is_active
                      ? t("deactivate")
                      : t("activate")}
                  </button>

                  <button
                    className="delete-button"
                    type="button"
                    onClick={() => deleteJob(job.id)}
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