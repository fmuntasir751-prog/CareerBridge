import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import api from "../services/api";

function RecommendedJobs() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isJapanese =
    i18n.language.startsWith("ja");

  useEffect(() => {
    const loadRecommendedJobs = async () => {
      try {
        const response = await api.get(
          "/jobs/recommended/",
        );

        setJobs(response.data.results || []);
      } catch {
        setError(
          isJapanese
            ? "おすすめ求人を読み込めませんでした。"
            : "Could not load recommended jobs.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadRecommendedJobs();
  }, [isJapanese]);

  const formatSalary = (job) => {
    const formatter = new Intl.NumberFormat(
      isJapanese ? "ja-JP" : "en-US",
    );

    if (job.salary_min && job.salary_max) {
      return (
        `¥${formatter.format(job.salary_min)} - ` +
        `¥${formatter.format(job.salary_max)}`
      );
    }

    if (job.salary_min) {
      return isJapanese
        ? `¥${formatter.format(job.salary_min)}～`
        : `From ¥${formatter.format(job.salary_min)}`;
    }

    if (job.salary_max) {
      return isJapanese
        ? `～¥${formatter.format(job.salary_max)}`
        : `Up to ¥${formatter.format(job.salary_max)}`;
    }

    return isJapanese
      ? "給与情報なし"
      : "Salary not specified";
  };

  if (loading) {
    return (
      <section className="recommended-jobs-section">
        <p>
          {isJapanese
            ? "おすすめ求人を分析しています..."
            : "Analyzing recommended jobs..."}
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="recommended-jobs-section">
        <p className="recommended-jobs-error">
          {error}
        </p>
      </section>
    );
  }

  if (jobs.length === 0) {
    return (
      <section className="recommended-jobs-section">
        <div className="recommended-jobs-heading">
          <div>
            <p className="eyebrow">
              {isJapanese
                ? "あなたへのおすすめ"
                : "Selected for you"}
            </p>

            <h2>
              {isJapanese
                ? "おすすめ求人"
                : "Recommended jobs"}
            </h2>
          </div>
        </div>

        <p>
          {isJapanese
            ? "現在おすすめできる求人がありません。"
            : "There are no active recommendations yet."}
        </p>
      </section>
    );
  }

  return (
    <section className="recommended-jobs-section">
      <div className="recommended-jobs-heading">
        <div>
          <p className="eyebrow">
            {isJapanese
              ? "あなたへのおすすめ"
              : "Selected for you"}
          </p>

          <h2>
            {isJapanese
              ? "おすすめ求人トップ3"
              : "Top recommended jobs"}
          </h2>

          <p>
            {isJapanese
              ? "プロフィール、スキル、希望条件に基づいています。"
              : "Based on your profile, skills and preferences."}
          </p>
        </div>

        <button
          className="secondary-button"
          type="button"
          onClick={() => navigate("/jobs")}
        >
          {isJapanese
            ? "すべての求人を見る"
            : "Browse all jobs"}
        </button>
      </div>

      <div className="recommended-jobs-grid">
        {jobs.map((job, index) => {
          const analysis =
            job.match_analysis || {};

          const title =
            isJapanese && job.title_ja
              ? job.title_ja
              : job.title_en;

          return (
            <article
              className="recommended-job-card"
              key={job.id}
            >
              <div className="recommended-job-top">
                <span className="recommendation-rank">
                  #{index + 1}
                </span>

                <div className="recommendation-score">
                  <strong>
                    {analysis.match_score || 0}%
                  </strong>

                  <small>
                    {isJapanese
                      ? "マッチ"
                      : "Match"}
                  </small>
                </div>
              </div>

              <h3>{title}</h3>

              <p className="recommended-company">
                {job.company_name}
              </p>

              <div className="recommended-job-meta">
                <span>📍 {job.location}</span>
                <span>🏢 {job.workplace_type}</span>
                <span>💴 {formatSalary(job)}</span>
              </div>

              {analysis.matching_skills?.length >
                0 && (
                <div className="recommended-skill-list">
                  {analysis.matching_skills
                    .slice(0, 3)
                    .map((skill) => (
                      <span key={skill}>
                        ✓ {skill}
                      </span>
                    ))}
                </div>
              )}

              <button
                className="recommended-job-button"
                type="button"
                onClick={() =>
                  navigate(`/jobs/${job.id}`)
                }
              >
                {isJapanese
                  ? "詳細と分析を見る"
                  : "View details and analysis"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default RecommendedJobs;