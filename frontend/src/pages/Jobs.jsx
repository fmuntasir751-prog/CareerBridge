import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import api from "../services/api";

function Jobs() {
  const { t, i18n } = useTranslation();

  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isJapanese = i18n.language.startsWith("ja");

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const response = await api.get("/jobs/");
        setJobs(response.data);
      } catch {
        setError(t("jobsLoadError"));
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, [t]);

  const filteredJobs = useMemo(() => {
    const keyword = search.toLowerCase();

    return jobs.filter((job) => {
      const searchableText = [
        job.title_en,
        job.title_ja,
        job.company_name,
        job.location,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(keyword);
    });
  }, [jobs, search]);

  const formatSalary = (salary) => {
    if (!salary) {
      return t("notSpecified");
    }

    return new Intl.NumberFormat(
      isJapanese ? "ja-JP" : "en-US",
      {
        style: "currency",
        currency: "JPY",
        maximumFractionDigits: 0,
      },
    ).format(salary);
  };

  if (loading) {
    return <div className="page-loading">{t("loading")}</div>;
  }

  return (
    <main className="jobs-page">
      <header className="dashboard-header">
        <a href="/" className="auth-brand">
          <span>CB</span>
          CareerBridge
        </a>

        <a className="back-link" href="/dashboard">
          {t("dashboard")}
        </a>
      </header>

      <section className="jobs-content">
        <p className="eyebrow">{t("careerOpportunities")}</p>
        <h1>{t("availableJobs")}</h1>

        <input
          className="job-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("searchJobs")}
        />

        {error && (
          <div className="form-message error">{error}</div>
        )}

        <div className="jobs-grid">
          {filteredJobs.map((job) => {
            const title =
              isJapanese && job.title_ja
                ? job.title_ja
                : job.title_en;

            const description =
              isJapanese && job.description_ja
                ? job.description_ja
                : job.description_en;

            return (
              <article className="job-card" key={job.id}>
                <div className="job-card-top">
                  <span>{job.company_name}</span>
                  <span>{job.workplace_type}</span>
                </div>

                <h2>{title}</h2>
                <p>{description}</p>

                <div className="job-meta">
                  <span>📍 {job.location}</span>
                  <span>💼 {job.employment_type}</span>
                  <span>🗣️ {job.japanese_level}</span>
                </div>

                <div className="job-salary">
                  {formatSalary(job.salary_min)}
                  {" – "}
                  {formatSalary(job.salary_max)}
                </div>

                <a
                  className="primary-button"
                  href={`/jobs/${job.id}`}
                >
                  {t("viewDetails")}
                </a>
              </article>
            );
          })}
        </div>

        {!filteredJobs.length && !error && (
          <p className="empty-message">{t("noJobsFound")}</p>
        )}
      </section>
    </main>
  );
}

export default Jobs;