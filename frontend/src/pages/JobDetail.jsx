import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../services/api";

function DetailIcon({ name }) {
  const paths = {
    location: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    employment: (
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
    workplace: (
      <>
        <path d="M4 21V5h10v16M14 10h6v11" />
        <path d="M8 9h2M8 13h2M8 17h2" />
      </>
    ),
    language: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3a15 15 0 0 1 0 18" />
        <path d="M12 3a15 15 0 0 0 0 18" />
      </>
    ),
    salary: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 7 4 5 4-5M8 14h8M8 17h8" />
      </>
    ),
    calendar: (
      <>
        <rect
          x="3"
          y="5"
          width="18"
          height="16"
          rx="2"
        />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </>
    ),
    bookmark: (
      <path d="M6 3h12v18l-6-4-6 4z" />
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
                  Number(savedJob.id)
                  === Number(id),
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

  const getRecommendationText = (
    recommendation,
  ) => {
    const recommendations = {
      improve_missing_skills: isJapanese
        ? "不足しているスキルを学習し、プロフィールに追加してください。"
        : "Develop the missing skills and add them to your profile.",
      review_location: isJapanese
        ? "希望勤務地と求人の勤務地を確認してください。"
        : "Review the job location and your preferred location.",
      review_workplace: isJapanese
        ? "希望する勤務形態を確認してください。"
        : "Review your preferred workplace arrangement.",
      improve_japanese: isJapanese
        ? "求人に必要な日本語レベルの向上を検討してください。"
        : "Consider improving your Japanese level for this role.",
      review_salary: isJapanese
        ? "希望給与と求人の給与範囲を確認してください。"
        : "Review your salary preference and the offered salary range.",
      upload_resume: isJapanese
        ? "応募前に履歴書をアップロードしてください。"
        : "Upload your resume before applying.",
    };

    if (
      typeof recommendation === "object"
      && recommendation !== null
    ) {
      return isJapanese
        ? recommendation.ja
          || recommendation.en
        : recommendation.en
          || recommendation.ja;
    }

    return (
      recommendations[recommendation]
      || recommendation
    );
  };

  if (error) {
    return (
      <div className="page-loading">
        <div>
          <p>{error}</p>

          <Link to="/jobs">
            {t("backToJobs")}
          </Link>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div
        className="page-loading"
        role="status"
      >
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
      ? (
        `¥${formatNumber(job.salary_min)} – `
        + `¥${formatNumber(job.salary_max)}`
      )
      : job.salary_min
        ? (
          isJapanese
            ? `¥${formatNumber(job.salary_min)}～`
            : `From ¥${formatNumber(job.salary_min)}`
        )
        : job.salary_max
          ? (
            isJapanese
              ? `最大 ¥${formatNumber(job.salary_max)}`
              : `Up to ¥${formatNumber(job.salary_max)}`
          )
          : t("notSpecified");

  const recommendations =
    matchAnalysis?.recommendations || [];

  const matches =
    matchAnalysis?.matches || {};

  const breakdown =
    matchAnalysis?.score_breakdown || {};

  const score =
    matchAnalysis?.match_score || 0;

  const readiness =
    matchAnalysis?.readiness || "low";

  const matchedCount =
    matchAnalysis?.matching_skills?.length
    || 0;

  const missingCount =
    matchAnalysis?.missing_skills?.length
    || 0;

  const totalSkills =
    matchedCount + missingCount;

  const getBreakdownNote = (
    key,
    value,
    maximum,
  ) => {
    if (value >= maximum) {
      return "";
    }

    if (key === "skills") {
      if (totalSkills === 0) {
        return "";
      }

      return isJapanese
        ? `必要スキル${totalSkills}件中${matchedCount}件が一致`
        : `${matchedCount} of ${totalSkills} required skills matched`;
    }

    const partial = value > 0;

    if (key === "job_title") {
      return isJapanese
        ? partial
          ? "希望職種と一部一致"
          : "希望職種と一致しません"
        : partial
          ? "Partly matches your desired title"
          : "Does not match your desired title";
    }

    return isJapanese
      ? partial
        ? "一部一致"
        : "希望条件と一致しません"
      : partial
        ? "Partly matches your preference"
        : "Does not match your preference";
  };

  const breakdownItems = [
    {
      key: "skills",
      label: isJapanese
        ? "スキル"
        : "Skills",
      value: breakdown.skills || 0,
      maximum: 40,
    },
    {
      key: "job_title",
      label: isJapanese
        ? "希望職種"
        : "Job title",
      value: breakdown.job_title || 0,
      maximum: 15,
    },
    {
      key: "location",
      label: isJapanese
        ? "勤務地"
        : "Location",
      value: breakdown.location || 0,
      maximum: 15,
    },
    {
      key: "workplace",
      label: isJapanese
        ? "勤務形態"
        : "Workplace",
      value: breakdown.workplace || 0,
      maximum: 10,
    },
    {
      key: "japanese_level",
      label: isJapanese
        ? "日本語レベル"
        : "Japanese",
      value:
        breakdown.japanese_level || 0,
      maximum: 10,
    },
    {
      key: "salary",
      label: isJapanese
        ? "給与"
        : "Salary",
      value: breakdown.salary || 0,
      maximum: 10,
    },
  ];

  const conditionItems = [
    {
      key: "location",
      label: isJapanese
        ? "勤務地"
        : "Location",
      value: matches.location,
    },
    {
      key: "workplace",
      label: isJapanese
        ? "勤務形態"
        : "Workplace",
      value: matches.workplace,
    },
    {
      key: "japanese",
      label: isJapanese
        ? "日本語レベル"
        : "Japanese level",
      value: matches.japanese_level,
    },
    {
      key: "salary",
      label: isJapanese
        ? "希望給与"
        : "Salary",
      value: matches.salary,
    },
  ];

  return (
    <main className="job-detail-page">
      <header className="dashboard-header">
        <Link
          to="/"
          className="auth-brand"
        >
          <span>CB</span>
          CareerBridge
        </Link>

        <button
          type="button"
          onClick={() => navigate("/jobs")}
        >
          ← {t("backToJobs")}
        </button>
      </header>

      <section className="job-detail-layout">
        <div className="job-detail-main">
          <div className="job-detail-company-row">
            <p className="eyebrow">
              {job.company_name}
            </p>

            {job.company_verified && (
              <span
                className="verified-company-badge"
                title={
                  isJapanese
                    ? "CareerBridgeによる認証済み企業"
                    : "Company verified by CareerBridge"
                }
              >
                <span aria-hidden="true">
                  ✓
                </span>

                {isJapanese
                  ? "認証済み企業"
                  : "Verified company"}
              </span>
            )}
          </div>

          <h1>{title}</h1>

          <div className="job-meta">
            <span>
              <DetailIcon name="location" />
              {job.location}
            </span>

            <span>
              <DetailIcon name="employment" />
              {job.employment_type}
            </span>

            <span>
              <DetailIcon name="workplace" />
              {job.workplace_type}
            </span>

            <span>
              <DetailIcon name="language" />
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

          {user?.role === "student" &&
            matchAnalysis && (
              <section className="job-match-analysis">
                <div className="job-match-heading">
                  <div
                    className={
                      `job-match-score ${readiness}`
                    }
                    role="img"
                    aria-label={
                      isJapanese
                        ? `マッチ度 ${score}パーセント`
                        : `${score} percent match`
                    }
                    style={{
                      "--detail-match-score":
                        `${score * 3.6}deg`,
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

                  <div>
                    <p className="eyebrow">
                      {isJapanese
                        ? "プロフィール分析"
                        : "Profile analysis"}
                    </p>

                    <h2>
                      {getReadinessLabel(
                        readiness,
                      )}
                    </h2>

                    <p>
                      {isJapanese
                        ? "6つの条件に基づいて、この求人との適合度を計算しました。"
                        : "Your match is calculated using six profile and job criteria."}
                    </p>
                  </div>
                </div>

                <div className="match-breakdown-section">
                  <div className="match-section-heading">
                    <h3>
                      {isJapanese
                        ? "スコアの内訳"
                        : "Score breakdown"}
                    </h3>

                    <small>
                      {isJapanese
                        ? "合計100点"
                        : "100 points total"}
                    </small>
                  </div>

                  <div className="match-breakdown-grid">
                    {breakdownItems.map((item) => {
                      const percentage =
                        item.maximum > 0
                          ? (
                            item.value
                            / item.maximum
                            * 100
                          )
                          : 0;

                      const note =
                        getBreakdownNote(
                          item.key,
                          item.value,
                          item.maximum,
                        );

                      return (
                        <article key={item.key}>
                          <div>
                            <span>
                              {item.label}
                            </span>

                            <strong>
                              {item.value}
                              <small>
                                /{item.maximum}
                              </small>
                            </strong>
                          </div>

                          <div
                            className="breakdown-progress"
                            role="progressbar"
                            aria-label={item.label}
                            aria-valuemin="0"
                            aria-valuemax={
                              item.maximum
                            }
                            aria-valuenow={
                              item.value
                            }
                          >
                            <span
                              style={{
                                width:
                                  `${percentage}%`,
                              }}
                            />
                          </div>

                          {note && (
                            <p className="breakdown-note">
                              {note}
                            </p>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </div>

                <div className="job-match-columns">
                  <div className="match-skill-panel matched">
                    <h3>
                      {isJapanese
                        ? "一致するスキル"
                        : "Matching skills"}
                    </h3>

                    <div className="skill-chip-list">
                      {matchAnalysis
                        .matching_skills
                        ?.length > 0 ? (
                          matchAnalysis
                            .matching_skills
                            .map((skill) => (
                              <span
                                className="skill-chip matched"
                                key={skill}
                              >
                                <span aria-hidden="true">
                                  ✓
                                </span>
                                {skill}
                              </span>
                            ))
                        ) : (
                          <p>
                            {isJapanese
                              ? "一致するスキルはまだありません。"
                              : "No exact skill matches found."}
                          </p>
                        )}
                    </div>
                  </div>

                  <div className="match-skill-panel missing">
                    <h3>
                      {isJapanese
                        ? "不足しているスキル"
                        : "Skills to improve"}
                    </h3>

                    <div className="skill-chip-list">
                      {matchAnalysis
                        .missing_skills
                        ?.length > 0 ? (
                          matchAnalysis
                            .missing_skills
                            .map((skill) => (
                              <span
                                className="skill-chip missing"
                                key={skill}
                              >
                                <span aria-hidden="true">
                                  +
                                </span>
                                {skill}
                              </span>
                            ))
                        ) : (
                          <p>
                            {isJapanese
                              ? "主要なスキル要件を満たしています。"
                              : "You meet the main skill requirements."}
                          </p>
                        )}
                    </div>
                  </div>
                </div>

                <div className="match-condition-section">
                  <h3>
                    {isJapanese
                      ? "条件の一致状況"
                      : "Preference matches"}
                  </h3>

                  <div className="match-condition-grid">
                    {conditionItems.map(
                      (condition) => {
                        const unknown =
                          condition.value === null
                          || condition.value
                          === undefined;

                        return (
                          <span
                            className={
                              unknown
                                ? "unknown"
                                : condition.value
                                  ? "matched"
                                  : "not-matched"
                            }
                            key={condition.key}
                          >
                            <span aria-hidden="true">
                              {unknown
                                ? "—"
                                : condition.value
                                  ? "✓"
                                  : "×"}
                            </span>

                            {condition.label}
                          </span>
                        );
                      },
                    )}
                  </div>
                </div>

                {recommendations.length > 0 && (
                  <div className="match-recommendations">
                    <h3>
                      {isJapanese
                        ? "次に改善できること"
                        : "How to improve your match"}
                    </h3>

                    <ol>
                      {recommendations.map(
                        (
                          recommendation,
                          index,
                        ) => (
                          <li
                            key={
                              `${
                                typeof recommendation
                                === "string"
                                  ? recommendation
                                  : "recommendation"
                              }-${index}`
                            }
                          >
                            {getRecommendationText(
                              recommendation,
                            )}
                          </li>
                        ),
                      )}
                    </ol>
                  </div>
                )}

                <p className="matching-method-note">
                  {isJapanese
                    ? "このスコアは、スキル40点、希望職種15点、勤務地15点、勤務形態10点、日本語10点、給与10点の重み付きルールに基づいています。"
                    : "This score uses a weighted rule: skills 40, job title 15, location 15, workplace 10, Japanese 10 and salary 10 points."}
                </p>
              </section>
            )}
        </div>

        <aside className="job-detail-sidebar">
          <div className="sidebar-detail-item">
            <DetailIcon name="salary" />

            <div>
              <h3>{t("salary")}</h3>
              <strong>{salaryText}</strong>
            </div>
          </div>

          <hr />

          <div className="sidebar-detail-item">
            <DetailIcon name="calendar" />

            <div>
              <h3>{t("deadline")}</h3>
              <p>
                {job.deadline
                  || t("notSpecified")}
              </p>
            </div>
          </div>

          {user?.role === "student" && (
            <>
              {message && (
                <p
                  className="job-save-message"
                  aria-live="polite"
                >
                  {message}
                </p>
              )}

              <button
                className="save-job-button"
                type="button"
                disabled={saving}
                onClick={toggleSavedJob}
              >
                <DetailIcon name="bookmark" />

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
                disabled={
                  job.accepts_applications
                  === false
                }
                onClick={() =>
                  navigate(
                    `/jobs/${job.id}/apply`,
                  )
                }
              >
                {job.accepts_applications
                  === false
                  ? isJapanese
                    ? "応募受付終了"
                    : "Applications closed"
                  : t("applyNow")}
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