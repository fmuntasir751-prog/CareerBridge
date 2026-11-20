import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import api from "../services/api";

function MetaIcon({ name }) {
  const paths = {
    location: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    workplace: (
      <>
        <rect
          x="3"
          y="7"
          width="18"
          height="13"
          rx="2"
        />
        <path d="M8 7V4h8v3M3 12h18" />
      </>
    ),
    salary: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 7 4 5 4-5M8 14h8M8 17h8" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

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
      setLoading(true);
      setError("");

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
        `¥${formatter.format(job.salary_min)} – ` +
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

  const getReadinessLabel = (readiness) => {
    const labels = {
      excellent: isJapanese
        ? "非常に高い適合度"
        : "Excellent match",
      good: isJapanese
        ? "高い適合度"
        : "Good match",
      developing: isJapanese
        ? "改善可能"
        : "Developing match",
      low: isJapanese
        ? "適合度が低い"
        : "Low match",
    };

    return labels[readiness] || labels.low;
  };

  if (loading) {
    return (
      <section
        className="recommended-jobs-section"
        aria-live="polite"
      >
        <div className="recommended-loading">
          <span
            className="recommended-loading-spinner"
            aria-hidden="true"
          />

          <p>
            {isJapanese
              ? "プロフィールと求人を分析しています..."
              : "Analyzing your profile and available jobs..."}
          </p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="recommended-jobs-section">
        <div
          className="recommended-jobs-error"
          role="alert"
        >
          <strong>
            {isJapanese
              ? "求人を読み込めませんでした"
              : "Recommendations unavailable"}
          </strong>

          <p>{error}</p>
        </div>
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

        <div className="recommended-empty-state">
          <strong>
            {isJapanese
              ? "現在おすすめできる求人がありません"
              : "No recommendations yet"}
          </strong>

          <p>
            {isJapanese
              ? "新しい求人が公開されると、プロフィールに基づいて表示されます。"
              : "New jobs will appear here when they match your profile."}
          </p>

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
              ? "スキル、希望職種、勤務地、勤務形態、日本語レベル、給与条件に基づいています。"
              : "Based on your skills, career goal, location, workplace, Japanese level and salary preference."}
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

          const score =
            analysis.match_score || 0;

          const readiness =
            analysis.readiness || "low";

          const title =
            isJapanese && job.title_ja
              ? job.title_ja
              : job.title_en;

          return (
            <article
              className={
                `recommended-job-card match-${readiness}`
              }
              key={job.id}
            >
              <div className="recommended-job-top">
                <span className="recommendation-rank">
                  {isJapanese
                    ? `おすすめ ${index + 1}`
                    : `#${index + 1} recommendation`}
                </span>

                <div
                  className="recommendation-score"
                  role="img"
                  aria-label={
                    isJapanese
                      ? `マッチ度 ${score}パーセント`
                      : `${score} percent match`
                  }
                  style={{
                    "--match-score": `${score * 3.6}deg`,
                  }}
                >
                  <div>
                    <strong>{score}%</strong>
                    <small>
                      {isJapanese
                        ? "マッチ"
                        : "Match"}
                    </small>
                  </div>
                </div>
              </div>

              <span
                className={
                  `match-readiness-badge ${readiness}`
                }
              >
                {getReadinessLabel(readiness)}
              </span>

              <h3>{title}</h3>

              <p className="recommended-company">
                {job.company_name}
              </p>

              <div className="recommended-job-meta">
                <span>
                  <MetaIcon name="location" />
                  {job.location}
                </span>

                <span>
                  <MetaIcon name="workplace" />
                  {job.workplace_type}
                </span>

                <span>
                  <MetaIcon name="salary" />
                  {formatSalary(job)}
                </span>
              </div>

              <div className="recommended-match-summary">
                <strong>
                  {isJapanese
                    ? "一致したスキル"
                    : "Matched skills"}
                </strong>

                {analysis.matching_skills?.length >
                0 ? (
                  <div className="recommended-skill-list">
                    {analysis.matching_skills
                      .slice(0, 3)
                      .map((skill) => (
                        <span key={skill}>
                          <span aria-hidden="true">
                            ✓
                          </span>
                          {skill}
                        </span>
                      ))}
                  </div>
                ) : (
                  <small>
                    {isJapanese
                      ? "スキルの一致はまだありません。"
                      : "No exact skill matches yet."}
                  </small>
                )}
              </div>

              {analysis.missing_skills?.length >
                0 && (
                <p className="recommended-improvement">
                  <strong>
                    {isJapanese
                      ? "改善候補："
                      : "Improve: "}
                  </strong>

                  {analysis.missing_skills
                    .slice(0, 2)
                    .join(", ")}
                </p>
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
                <span aria-hidden="true">→</span>
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default RecommendedJobs;