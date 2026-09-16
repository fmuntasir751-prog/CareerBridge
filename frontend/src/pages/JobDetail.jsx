import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../services/api";


function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [job, setJob] = useState(null);
  const [user, setUser] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isJapanese = i18n.language.startsWith("ja");

  useEffect(() => {
    const loadPage = async () => {
      try {
        const jobResponse = await api.get(
          `/jobs/${id}/`,
        );

        setJob(jobResponse.data);
      } catch {
        setError(t("jobNotFound"));
        return;
      }

      try {
        const userResponse = await api.get(
          "/auth/me/",
        );

        const currentUser = userResponse.data;
        setUser(currentUser);

        if (currentUser.role === "student") {
          const savedResponse = await api.get(
            "/jobs/saved/",
          );

          const saved = savedResponse.data.some(
            (savedJob) =>
              Number(savedJob.id) === Number(id),
          );

          setIsSaved(saved);
        }
      } catch {
        setUser(null);
      }
    };

    loadPage();
  }, [id, t]);

  const toggleSavedJob = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      if (isSaved) {
        await api.delete(
          `/jobs/${job.id}/save/`,
        );

        setIsSaved(false);

        setMessage(
          isJapanese
            ? "保存済み求人から削除しました。"
            : "Job removed from saved jobs.",
        );
      } else {
        await api.post(
          `/jobs/${job.id}/save/`,
        );

        setIsSaved(true);

        setMessage(
          isJapanese
            ? "求人を保存しました。"
            : "Job saved successfully.",
        );
      }
    } catch {
      setMessage(
        isJapanese
          ? "求人の保存状態を変更できませんでした。"
          : "Could not update the saved job.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <div className="page-loading">
        <div>
          <p>{error}</p>

          <a href="/jobs">
            {t("backToJobs")}
          </a>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="page-loading">
        {t("loading")}
      </div>
    );
  }

  const title =
    isJapanese && job.title_ja
      ? job.title_ja
      : job.title_en;

  const description =
    isJapanese && job.description_ja
      ? job.description_ja
      : job.description_en;

  const formatNumber = (value) =>
    new Intl.NumberFormat(
      isJapanese ? "ja-JP" : "en-US",
    ).format(value);

  const salaryText =
    job.salary_min && job.salary_max
      ? `¥${formatNumber(
          job.salary_min,
        )} - ¥${formatNumber(job.salary_max)}`
      : t("notSpecified");

  return (
    <main className="job-detail-page">
      <header className="dashboard-header">
        <a href="/" className="auth-brand">
          <span>CB</span>
          CareerBridge
        </a>

        <button
          type="button"
          onClick={() => navigate("/jobs")}
        >
          ← {t("backToJobs")}
        </button>
      </header>

      <section className="job-detail-content">
        <div className="job-detail-main">
          <p className="eyebrow">
            {job.company_name
              || job.company_username
              || "CareerBridge Company"}
          </p>

          <h1>{title}</h1>

          <div className="job-meta-list">
            <span>
              {t("location")}: {job.location}
            </span>

            <span>
              {t("employmentType")}:{" "}
              {job.employment_type}
            </span>

            <span>
              {t("workplaceType")}:{" "}
              {job.workplace_type}
            </span>

            <span>
              {t("japaneseLevel")}:{" "}
              {job.japanese_level}
            </span>
          </div>

          <section>
            <h2>{t("jobDescription")}</h2>
            <p>{description}</p>
          </section>

          <section>
            <h2>{t("requirements")}</h2>

            <p>
              {job.requirements
                || t("notSpecified")}
            </p>
          </section>
        </div>

        <aside className="job-detail-sidebar">
          <h3>{t("salary")}</h3>
          <strong>{salaryText}</strong>

          <hr />

          <h3>{t("deadline")}</h3>

          <p>
            {job.deadline
              || t("notSpecified")}
          </p>

          {message && (
            <div className="job-save-message">
              {message}
            </div>
          )}

          {user?.role === "student" && (
            <>
              <button
                className="save-job-button"
                type="button"
                onClick={toggleSavedJob}
                disabled={saving}
              >
                {saving
                  ? (
                    isJapanese
                      ? "処理中..."
                      : "Saving..."
                  )
                  : (
                    isSaved
                      ? (
                        isJapanese
                          ? "保存済み"
                          : "Saved"
                      )
                      : (
                        isJapanese
                          ? "求人を保存"
                          : "Save job"
                      )
                  )}
              </button>

              <button
                className="submit-button"
                type="button"
                onClick={() =>
                  navigate(
                    `/jobs/${job.id}/apply`,
                  )
                }
              >
                {t("applyNow")}
              </button>
            </>
          )}

          {!user && (
            <button
              className="submit-button"
              type="button"
              onClick={() => navigate("/login")}
            >
              {isJapanese
                ? "ログインして応募"
                : "Log in to apply"}
            </button>
          )}
        </aside>
      </section>
    </main>
  );
}


export default JobDetail;