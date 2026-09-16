import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import api from "../services/api";

function SavedJobs() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);

  const isJapanese = i18n.language.startsWith("ja");

  useEffect(() => {
    const loadSavedJobs = async () => {
      try {
        const response = await api.get("/jobs/saved/");
        setJobs(response.data);
      } catch {
        setError(
          isJapanese
            ? "保存した求人を読み込めませんでした。"
            : "Could not load your saved jobs.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadSavedJobs();
  }, [isJapanese]);

  const removeSavedJob = async (jobId) => {
    setError("");
    setRemovingId(jobId);

    try {
      await api.delete(`/jobs/${jobId}/save/`);

      setJobs((currentJobs) =>
        currentJobs.filter((job) => job.id !== jobId),
      );
    } catch {
      setError(
        isJapanese
          ? "保存した求人を削除できませんでした。"
          : "Could not remove the saved job.",
      );
    } finally {
      setRemovingId(null);
    }
  };

  const formatSalary = (value) => {
    if (!value) {
      return isJapanese ? "未設定" : "Not specified";
    }

    return new Intl.NumberFormat(
      isJapanese ? "ja-JP" : "en-US",
    ).format(value);
  };

  if (loading) {
    return (
      <div className="page-loading">
        {isJapanese ? "読み込み中..." : "Loading..."}
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
          ← {isJapanese ? "ダッシュボード" : "Dashboard"}
        </button>
      </header>

      <section className="applications-content">
        <p className="eyebrow">
          {isJapanese ? "求人コレクション" : "Job collection"}
        </p>

        <h1>
          {isJapanese ? "保存した求人" : "Saved jobs"}
        </h1>

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
                  <span className="status-badge">
                    {isJapanese ? "保存済み" : "Saved"}
                  </span>

                  <h2>{title}</h2>

                  <p>{job.company_name || job.company}</p>
                  <p>{job.location}</p>

                  <strong>
                    ¥{formatSalary(job.salary_min)}
                    {" – "}
                    ¥{formatSalary(job.salary_max)}
                  </strong>
                </div>

                <div className="job-management-actions">
                  <a
                    className="secondary-button"
                    href={`/jobs/${job.id}`}
                  >
                    {isJapanese
                      ? "詳細を見る"
                      : "View details"}
                  </a>

                  <button
                    className="delete-button"
                    type="button"
                    disabled={removingId === job.id}
                    onClick={() => removeSavedJob(job.id)}
                  >
                    {removingId === job.id
                      ? isJapanese
                        ? "削除中..."
                        : "Removing..."
                      : isJapanese
                        ? "保存から削除"
                        : "Remove"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {!jobs.length && !error && (
          <div className="empty-message">
            <p>
              {isJapanese
                ? "保存した求人はまだありません。"
                : "You have not saved any jobs yet."}
            </p>

            <a className="primary-button" href="/jobs">
              {isJapanese ? "求人を探す" : "Browse jobs"}
            </a>
          </div>
        )}
      </section>
    </main>
  );
}

export default SavedJobs;