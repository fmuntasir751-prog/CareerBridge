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
  const [matchAnalysis, setMatchAnalysis] =
    useState(null);

  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isJapanese =
    i18n.language.startsWith("ja");

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
          const [
            savedResponse,
            matchResponse,
          ] = await Promise.allSettled([
            api.get("/jobs/saved/"),
            api.get(
              `/jobs/${id}/match-analysis/`,
            ),
          ]);

          if (
            savedResponse.status === "fulfilled"
          ) {
            const saved =
              savedResponse.value.data.some(
                (savedJob) =>
                  Number(savedJob.id) ===
                  Number(id),
              );

            setIsSaved(saved);
          }

          if (
            matchResponse.status === "fulfilled"
          ) {
            setMatchAnalysis(
              matchResponse.value.data,
            );
          }
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
          ? "保存状態を更新できませんでした。"
          : "Could not update the saved job.",
      );
    } finally {
      setSaving(false);
    }
  };

  const getReadinessLabel = (readiness) => {
    const labels = {
      excellent: isJapanese
        ? "非常に良いマッチ"
        : "Excellent match",
      strong: isJapanese
        ? "良いマッチ"
        : "Strong match",
      moderate: isJapanese
        ? "適度なマッチ"
        : "Moderate match",
      developing: isJapanese
        ? "スキル向上が必要"
        : "Developing match",
    };

    return labels[readiness] || readiness;
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
      : job.salary_min
        ? `${isJapanese ? "¥" : "From ¥"}${formatNumber(
            job.salary_min,
          )}`
        : job.salary_max
          ? `${isJapanese ? "最大 ¥" : "Up to ¥"}${formatNumber(
              job.salary_max,
            )}`
          : t("notSpecified");

  const recommendations =
    matchAnalysis?.recommendations || [];

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

      <section className="job-detail-layout">
        <div className="job-detail-main">
          <p className="eyebrow">
            {job.company_name}
          </p>

          <h1>{title}</h1>

          <div className="job-meta">
            <span>📍 {job.location}</span>
            <span>
              💼 {job.employment_type}
            </span>
            <span>
              🏢 {job.workplace_type}
            </span>
            <span>
              🗣️ {job.japanese_level}
            </span>
          </div>

          <section>
            <h2>{t("jobDescription")}</h2>
            <p>{description}</p>
          </section>

          <section>
            <h2>{t("requirements")}</h2>
            <p>
              {job.requirements ||
                t("notSpecified")}
            </p>
          </section>

          {user?.role === "student" &&
            matchAnalysis && (
              <section className="job-match-analysis">
                <div className="job-match-heading">
                  <div
                    className="job-match-score"
                    aria-label={`Match score ${matchAnalysis.match_score}%`}
                  >
                    <strong>
                      {matchAnalysis.match_score}%
                    </strong>

                    <small>
                      {isJapanese
                        ? "マッチ"
                        : "Match"}
                    </small>
                  </div>

                  <div>
                    <p className="eyebrow">
                      {isJapanese
                        ? "プロフィール分析"
                        : "Profile analysis"}
                    </p>

                    <h2>
                      {getReadinessLabel(
                        matchAnalysis.readiness,
                      )}
                    </h2>
                  </div>
                </div>

                <div className="job-match-columns">
                  <div>
                    <h3>
                      {isJapanese
                        ? "一致するスキル"
                        : "Matching skills"}
                    </h3>

                    <div className="skill-chip-list">
                      {matchAnalysis
                        .matching_skills?.length >
                      0 ? (
                        matchAnalysis.matching_skills.map(
                          (skill) => (
                            <span
                              className="skill-chip matched"
                              key={skill}
                            >
                              ✓ {skill}
                            </span>
                          ),
                        )
                      ) : (
                        <p>
                          {isJapanese
                            ? "一致するスキルはまだありません。"
                            : "No matching skills found yet."}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3>
                      {isJapanese
                        ? "不足しているスキル"
                        : "Skills to improve"}
                    </h3>

                    <div className="skill-chip-list">
                      {matchAnalysis
                        .missing_skills?.length >
                      0 ? (
                        matchAnalysis.missing_skills.map(
                          (skill) => (
                            <span
                              className="skill-chip missing"
                              key={skill}
                            >
                              + {skill}
                            </span>
                          ),
                        )
                      ) : (
                        <p>
                          {isJapanese
                            ? "主要なスキルを満たしています。"
                            : "You meet the main skill requirements."}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="match-condition-grid">
                  <span>
                    {matchAnalysis.location_match
                      ? "✓"
                      : "○"}{" "}
                    {isJapanese
                      ? "勤務地"
                      : "Location"}
                  </span>

                  <span>
                    {matchAnalysis.workplace_match
                      ? "✓"
                      : "○"}{" "}
                    {isJapanese
                      ? "勤務形態"
                      : "Workplace"}
                  </span>

                  <span>
                    {matchAnalysis.japanese_match
                      ? "✓"
                      : "○"}{" "}
                    {isJapanese
                      ? "日本語レベル"
                      : "Japanese level"}
                  </span>

                  <span>
                    {matchAnalysis.salary_match
                      ? "✓"
                      : "○"}{" "}
                    {isJapanese
                      ? "希望給与"
                      : "Salary"}
                  </span>
                </div>

                {recommendations.length > 0 && (
                  <div className="match-recommendations">
                    <h3>
                      {isJapanese
                        ? "おすすめの改善点"
                        : "Recommendations"}
                    </h3>

                    <ol>
                      {recommendations.map(
                        (recommendation, index) => (
                          <li key={`${recommendation}-${index}`}>
                            {typeof recommendation ===
                            "object"
                              ? isJapanese
                                ? recommendation.ja ||
                                  recommendation.en
                                : recommendation.en ||
                                  recommendation.ja
                              : recommendation}
                          </li>
                        ),
                      )}
                    </ol>
                  </div>
                )}
              </section>
            )}
        </div>

        <aside className="job-detail-sidebar">
          <h3>{t("salary")}</h3>
          <strong>{salaryText}</strong>

          <hr />

          <h3>{t("deadline")}</h3>
          <p>
            {job.deadline ||
              t("notSpecified")}
          </p>

          {user?.role === "student" && (
            <>
              {message && (
                <p className="job-save-message">
                  {message}
                </p>
              )}

              <button
                className="save-job-button"
                type="button"
                disabled={saving}
                onClick={toggleSavedJob}
              >
                {saving
                  ? isJapanese
                    ? "更新中..."
                    : "Saving..."
                  : isSaved
                    ? isJapanese
                      ? "保存済み"
                      : "Saved"
                    : isJapanese
                      ? "求人を保存"
                      : "Save job"}
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

          {user?.role === "company" && (
            <button
              className="secondary-button"
              type="button"
              onClick={() =>
                navigate("/dashboard")
              }
            >
              {isJapanese
                ? "ダッシュボードへ"
                : "Go to dashboard"}
            </button>
          )}
        </aside>
      </section>
    </main>
  );
}

export default JobDetail;