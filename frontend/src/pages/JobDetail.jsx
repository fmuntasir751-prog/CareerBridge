import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import api from "../services/api";

function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [job, setJob] = useState(null);
  const [error, setError] = useState("");

  const isJapanese = i18n.language.startsWith("ja");

  useEffect(() => {
    const loadJob = async () => {
      try {
        const response = await api.get(`/jobs/${id}/`);
        setJob(response.data);
      } catch {
        setError(t("jobNotFound"));
      }
    };

    loadJob();
  }, [id, t]);

  if (error) {
    return (
      <div className="page-loading">
        <div>
          <p>{error}</p>
          <a href="/jobs">{t("backToJobs")}</a>
        </div>
      </div>
    );
  }

  if (!job) {
    return <div className="page-loading">{t("loading")}</div>;
  }

  const title =
    isJapanese && job.title_ja
      ? job.title_ja
      : job.title_en;

  const description =
    isJapanese && job.description_ja
      ? job.description_ja
      : job.description_en;

  const salary = (value) =>
    value
      ? new Intl.NumberFormat(
          isJapanese ? "ja-JP" : "en-US",
        ).format(value)
      : t("notSpecified");

  return (
    <main className="job-detail-page">
      <header className="dashboard-header">
        <a href="/" className="auth-brand">
          <span>CB</span>
          CareerBridge
        </a>

        <button type="button" onClick={() => navigate("/jobs")}>
          ← {t("backToJobs")}
        </button>
      </header>

      <section className="job-detail-content">
        <div className="job-detail-main">
          <p className="eyebrow">{job.company_name}</p>
          <h1>{title}</h1>

          <div className="job-meta">
            <span>📍 {job.location}</span>
            <span>💼 {job.employment_type}</span>
            <span>🏠 {job.workplace_type}</span>
            <span>🗣️ {job.japanese_level}</span>
          </div>

          <section>
            <h2>{t("jobDescription")}</h2>
            <p>{description}</p>
          </section>

          <section>
            <h2>{t("requirements")}</h2>
            <p>{job.requirements || t("notSpecified")}</p>
          </section>
        </div>

        <aside className="job-detail-sidebar">
          <h3>{t("salary")}</h3>
          <strong>
            ¥{salary(job.salary_min)} – ¥{salary(job.salary_max)}
          </strong>

          <hr />

          <h3>{t("deadline")}</h3>
          <p>{job.deadline || t("notSpecified")}</p>

          <button
  className="submit-button"
  type="button"
  onClick={() => navigate(`/jobs/${job.id}/apply`)}
>
  {t("applyNow")}
</button>
        </aside>
      </section>
    </main>
  );
}

export default JobDetail;