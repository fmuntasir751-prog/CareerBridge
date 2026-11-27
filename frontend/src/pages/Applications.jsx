import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import api, {
  getApiErrorMessage,
} from "../services/api";
import DashboardHeader from "../components/DashboardHeader";
const companyStatusOptions = [
  "pending",
  "reviewing",
  "interview",
  "accepted",
  "rejected",
];

const statusLabels = {
  en: {
    all: "All",
    pending: "Pending",
    reviewing: "Reviewing",
    interview: "Interview",
    accepted: "Accepted",
    rejected: "Rejected",
    withdrawn: "Withdrawn",
  },
  ja: {
    all: "すべて",
    pending: "応募済み",
    reviewing: "選考中",
    interview: "面接",
    accepted: "採用",
    rejected: "不採用",
    withdrawn: "辞退",
  },
};

const readinessLabels = {
  en: {
    excellent: "Excellent match",
    good: "Good match",
    developing: "Developing match",
    low: "Low match",
  },
  ja: {
    excellent: "非常に高い適合度",
    good: "高い適合度",
    developing: "改善可能",
    low: "低い適合度",
  },
};

const breakdownLabels = {
  en: {
    skills: "Skills",
    job_title: "Job title",
    location: "Location",
    workplace: "Workplace",
    japanese_level: "Japanese",
    salary: "Salary",
  },
  ja: {
    skills: "スキル",
    job_title: "希望職種",
    location: "勤務地",
    workplace: "勤務形態",
    japanese_level: "日本語レベル",
    salary: "給与",
  },
};

const activeStudentStatuses = [
  "pending",
  "reviewing",
  "interview",
];

function MatchPanel({
  analysis,
  score,
  isJapanese,
  language,
}) {
  if (!analysis) {
    return null;
  }

  const safeScore =
    Number(score) || 0;

  const matchingSkills =
    analysis.matching_skills || [];

  const missingSkills =
    analysis.missing_skills || [];

  const scoreBreakdown =
    analysis.score_breakdown || {};

  return (
    <section className="applicant-match-panel">
      <div className="applicant-match-heading">
        <div>
          <span className="match-panel-label">
            {isJapanese
              ? "マッチング分析"
              : "Matching analysis"}
          </span>

          <h3>
            {readinessLabels[language][
              analysis.readiness
            ] || analysis.readiness}
          </h3>

          <p>
            {isJapanese
              ? "応募者プロフィールと求人条件の比較"
              : "Comparison of the applicant profile and job requirements"}
          </p>
        </div>

        <div className="applicant-match-score">
          <strong>{safeScore}</strong>
          <span>%</span>
        </div>
      </div>

      <div
        className="match-progress"
        role="progressbar"
        aria-label={
          isJapanese
            ? "応募者の適合率"
            : "Applicant match percentage"
        }
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={safeScore}
      >
        <span
          style={{
            width: `${Math.min(
              100,
              Math.max(0, safeScore),
            )}%`,
          }}
        />
      </div>

      <div className="match-skill-columns">
        <div>
          <h4>
            {isJapanese
              ? "一致するスキル"
              : "Matching skills"}
          </h4>

          <div className="match-skill-list">
            {matchingSkills.length ? (
              matchingSkills.map((skill) => (
                <span
                  className="match-skill matched"
                  key={skill}
                >
                  ✓ {skill}
                </span>
              ))
            ) : (
              <span className="match-empty">
                {isJapanese
                  ? "一致するスキルはありません"
                  : "No matching skills detected"}
              </span>
            )}
          </div>
        </div>

        <div>
          <h4>
            {isJapanese
              ? "不足しているスキル"
              : "Missing skills"}
          </h4>

          <div className="match-skill-list">
            {missingSkills.length ? (
              missingSkills.map((skill) => (
                <span
                  className="match-skill missing"
                  key={skill}
                >
                  + {skill}
                </span>
              ))
            ) : (
              <span className="match-empty">
                {isJapanese
                  ? "不足スキルはありません"
                  : "No missing skills detected"}
              </span>
            )}
          </div>
        </div>
      </div>

      <details className="match-breakdown">
        <summary>
          {isJapanese
            ? "スコアの詳細を見る"
            : "View score breakdown"}
        </summary>

        <div className="match-breakdown-grid">
          {Object.entries(
            scoreBreakdown,
          ).map(([name, value]) => (
            <div key={name}>
              <span>
                {breakdownLabels[language][
                  name
                ] ||
                  name.replaceAll(
                    "_",
                    " ",
                  )}
              </span>

              <strong>
                {value}
              </strong>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}

function StudentStatusTimeline({
  status,
  isJapanese,
}) {
  const steps = [
    {
      key: "pending",
      label: isJapanese
        ? "応募済み"
        : "Applied",
    },
    {
      key: "reviewing",
      label: isJapanese
        ? "書類選考"
        : "Reviewing",
    },
    {
      key: "interview",
      label: isJapanese
        ? "面接"
        : "Interview",
    },
    {
      key: "accepted",
      label: isJapanese
        ? "結果"
        : "Decision",
    },
  ];

  const order = [
    "pending",
    "reviewing",
    "interview",
    "accepted",
  ];

  const currentIndex =
    order.indexOf(status);

  const isCompletedStatus = [
    "accepted",
    "rejected",
    "withdrawn",
  ].includes(status);

  return (
    <div
      className={
        `application-timeline status-${status}`
      }
    >
      {steps.map((step, index) => {
        const isComplete =
          currentIndex >= index ||
          (
            isCompletedStatus &&
            index <= 2
          );

        const isCurrent =
          step.key === status ||
          (
            index === 3 &&
            isCompletedStatus
          );

        return (
          <div
            className={
              [
                "application-timeline-step",
                isComplete
                  ? "complete"
                  : "",
                isCurrent
                  ? "current"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")
            }
            key={step.key}
          >
            <span aria-hidden="true">
              {isComplete ? "✓" : ""}
            </span>

            <small>
              {step.label}
            </small>
          </div>
        );
      })}
    </div>
  );
}

function Applications() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const isJapanese =
    i18n.language.startsWith("ja");

  const language =
    isJapanese ? "ja" : "en";

  const [user, setUser] =
    useState(null);

  const [
    applications,
    setApplications,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [
    updatingId,
    setUpdatingId,
  ] = useState(null);

  const [
    withdrawingId,
    setWithdrawingId,
  ] = useState(null);

  const [
    activeFilter,
    setActiveFilter,
  ] = useState("all");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  useEffect(() => {
    const loadApplications = async () => {
      try {
        const [
          userResponse,
          applicationsResponse,
        ] = await Promise.all([
          api.get("/auth/me/"),
          api.get("/applications/"),
        ]);

        setUser(userResponse.data);

        setApplications(
          applicationsResponse.data,
        );
      } catch (requestError) {
        setError(
          getApiErrorMessage(
            requestError,
            isJapanese
              ? "応募情報を読み込めませんでした。"
              : "Could not load applications.",
          ),
        );
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, [isJapanese]);

  const applicationCounts =
    useMemo(() => {
      const counts = {
        all: applications.length,
        pending: 0,
        reviewing: 0,
        interview: 0,
        accepted: 0,
        rejected: 0,
        withdrawn: 0,
      };

      applications.forEach(
        (application) => {
          if (
            Object.prototype.hasOwnProperty.call(
              counts,
              application.status,
            )
          ) {
            counts[
              application.status
            ] += 1;
          }
        },
      );

      return counts;
    }, [applications]);

  const filteredApplications =
    useMemo(() => {
      if (activeFilter === "all") {
        return applications;
      }

      return applications.filter(
        (application) =>
          application.status ===
          activeFilter,
      );
    }, [
      activeFilter,
      applications,
    ]);

  const updateStatus = async (
    applicationId,
    newStatus,
  ) => {
    setError("");
    setSuccess("");
    setUpdatingId(applicationId);

    try {
      const response = await api.patch(
        `/applications/${applicationId}/`,
        {
          status: newStatus,
        },
      );

      setApplications(
        (currentApplications) =>
          currentApplications.map(
            (application) =>
              application.id ===
              applicationId
                ? {
                    ...application,
                    status:
                      response.data.status,
                  }
                : application,
          ),
      );

      setSuccess(
        isJapanese
          ? "応募ステータスを更新しました。"
          : "Application status was updated.",
      );
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          isJapanese
            ? "ステータスを更新できませんでした。"
            : "Could not update the application status.",
        ),
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const withdrawApplication = async (
    applicationId,
  ) => {
    const confirmed = window.confirm(
      isJapanese
        ? "この応募を辞退しますか？"
        : "Are you sure you want to withdraw this application?",
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");
    setWithdrawingId(applicationId);

    try {
      const response = await api.post(
        `/applications/${applicationId}/withdraw/`,
      );

      setApplications(
        (currentApplications) =>
          currentApplications.map(
            (application) =>
              application.id ===
              applicationId
                ? response.data
                : application,
          ),
      );

      setSuccess(
        isJapanese
          ? "応募を辞退しました。"
          : "Your application was withdrawn.",
      );
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          isJapanese
            ? "応募を辞退できませんでした。"
            : "Could not withdraw the application.",
        ),
      );
    } finally {
      setWithdrawingId(null);
    }
  };

  const getJobTitle = (
    application,
  ) => {
    if (
      isJapanese &&
      application.job_title_ja
    ) {
      return application.job_title_ja;
    }

    return application.job_title;
  };

  const formatDate = (dateValue) =>
    new Date(
      dateValue,
    ).toLocaleDateString(
      isJapanese
        ? "ja-JP"
        : "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      },
    );

  if (loading) {
    return (
      <div className="page-loading">
        {t("loading")}
      </div>
    );
  }

  const isCompany =
    user?.role === "company";

  const filterKeys = [
    "all",
    "pending",
    "reviewing",
    "interview",
    "accepted",
    "rejected",
    "withdrawn",
  ];

  const summaryItems = isCompany
    ? [
        {
          key: "all",
          label: isJapanese
            ? "すべての応募"
            : "Total applications",
          value:
            applicationCounts.all,
          icon: "applications",
        },
        {
          key: "reviewing",
          label: isJapanese
            ? "選考中"
            : "In review",
          value:
            applicationCounts.pending +
            applicationCounts.reviewing,
          icon: "reviewing",
        },
        {
          key: "interview",
          label: isJapanese
            ? "面接"
            : "Interviews",
          value:
            applicationCounts.interview,
          icon: "interview",
        },
        {
          key: "accepted",
          label: isJapanese
            ? "採用"
            : "Accepted",
          value:
            applicationCounts.accepted,
          icon: "accepted",
        },
      ]
    : [
        {
          key: "all",
          label: isJapanese
            ? "すべての応募"
            : "Total applications",
          value:
            applicationCounts.all,
          icon: "applications",
        },
        {
          key: "active",
          label: isJapanese
            ? "進行中"
            : "Active",
          value:
            activeStudentStatuses.reduce(
              (total, status) =>
                total +
                applicationCounts[status],
              0,
            ),
          icon: "reviewing",
        },
        {
          key: "interview",
          label: isJapanese
            ? "面接"
            : "Interviews",
          value:
            applicationCounts.interview,
          icon: "interview",
        },
        {
          key: "accepted",
          label: isJapanese
            ? "採用"
            : "Accepted",
          value:
            applicationCounts.accepted,
          icon: "accepted",
        },
      ];

  return (
    <main className="applications-page applications-dashboard">
      {user?.role && <DashboardHeader role={user.role} />}

      <section className="applications-content">
        <div className="applications-heading">
          <div>
            <p className="eyebrow">
              {isCompany
                ? (
                  isJapanese
                    ? "採用管理"
                    : "Recruitment management"
                )
                : (
                  isJapanese
                    ? "応募活動"
                    : "Job search activity"
                )}
            </p>

            <h1>
              {isCompany
                ? (
                  isJapanese
                    ? "応募者を管理"
                    : "Manage applicants"
                )
                : (
                  isJapanese
                    ? "応募履歴"
                    : "My applications"
                )}
            </h1>

            <p>
              {isCompany
                ? (
                  isJapanese
                    ? "応募者の適合度を確認し、選考ステータスを管理します。"
                    : "Review applicant fit and manage every hiring stage."
                )
                : (
                  isJapanese
                    ? "応募した求人と選考の進捗を確認できます。"
                    : "Track your applications and recruitment progress."
                )}
            </p>
          </div>

          <button
            className="primary-button"
            type="button"
            onClick={() =>
              navigate(
                isCompany
                  ? "/my-jobs"
                  : "/jobs",
              )
            }
          >
            {isCompany
              ? (
                isJapanese
                  ? "求人を管理"
                  : "Manage jobs"
              )
              : (
                isJapanese
                  ? "求人を探す"
                  : "Browse jobs"
              )}
          </button>
        </div>

        {error && (
          <div
            className="form-message error"
            role="alert"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="form-message success"
            role="status"
          >
            {success}
          </div>
        )}

        <section className="application-summary-grid">
          {summaryItems.map((item) => (
            <article key={item.key}>
              <span
                className={
                  `application-summary-icon ${
                    item.icon
                  }`
                }
                aria-hidden="true"
              >
                {item.icon ===
                  "applications" && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path d="M6 3h12v18H6z" />
                    <path d="M9 7h6" />
                    <path d="M9 11h6" />
                    <path d="M9 15h4" />
                  </svg>
                )}

                {item.icon ===
                  "reviewing" && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                    />
                    <path d="M12 7v5l3 2" />
                  </svg>
                )}

                {item.icon ===
                  "interview" && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path d="M4 5h16v12H8l-4 4V5z" />
                    <path d="M8 9h8" />
                    <path d="M8 13h5" />
                  </svg>
                )}

                {item.icon ===
                  "accepted" && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                    />
                    <path d="M8 12l3 3 5-6" />
                  </svg>
                )}
              </span>

              <div>
                <small>
                  {item.label}
                </small>

                <strong>
                  {item.value}
                </strong>
              </div>
            </article>
          ))}
        </section>

        <div className="application-toolbar">
          <div
            className="application-filters"
            role="group"
            aria-label={
              isJapanese
                ? "応募ステータス"
                : "Application status filters"
            }
          >
            {filterKeys.map(
              (filterKey) => (
                <button
                  className={
                    activeFilter ===
                    filterKey
                      ? "active"
                      : ""
                  }
                  type="button"
                  key={filterKey}
                  onClick={() =>
                    setActiveFilter(
                      filterKey,
                    )
                  }
                >
                  {
                    statusLabels[
                      language
                    ][filterKey]
                  }

                  <span>
                    {
                      applicationCounts[
                        filterKey
                      ]
                    }
                  </span>
                </button>
              ),
            )}
          </div>

          <p>
            {isJapanese
              ? `${filteredApplications.length}件`
              : (
                `${filteredApplications.length} ${
                  filteredApplications.length ===
                  1
                    ? "application"
                    : "applications"
                }`
              )}
          </p>
        </div>

        {filteredApplications.length >
        0 ? (
          <div className="professional-application-list">
            {filteredApplications.map(
              (application) => {
                const matchAnalysis =
                  application
                    .applicant_match_analysis;

                const matchScore =
                  application
                    .applicant_match_score;

                const isUpdating =
                  updatingId ===
                  application.id;

                const isWithdrawing =
                  withdrawingId ===
                  application.id;

                return (
                  <article
                    className="professional-application-card"
                    key={application.id}
                  >
                    <div className="application-card-header">
                      <div>
                        <span
                          className={
                            `status-badge ` +
                            `status-${application.status}`
                          }
                        >
                          {
                            statusLabels[
                              language
                            ][
                              application.status
                            ]
                          }
                        </span>

                        <h2>
                          {getJobTitle(
                            application,
                          )}
                        </h2>

                        <p>
                          {
                            application
                              .company_name
                          }
                        </p>
                      </div>

                      <div className="application-date">
                        <small>
                          {isJapanese
                            ? "応募日"
                            : "Applied"}
                        </small>

                        <strong>
                          {formatDate(
                            application
                              .applied_at,
                          )}
                        </strong>
                      </div>
                    </div>

                    {!isCompany && (
                      <StudentStatusTimeline
                        status={
                          application.status
                        }
                        isJapanese={
                          isJapanese
                        }
                      />
                    )}

                    {isCompany && (
                      <section className="applicant-profile-summary">
                        <div className="applicant-avatar">
                          {application
                            .applicant_name
                            ?.charAt(0)
                            ?.toUpperCase() ||
                            "A"}
                        </div>

                        <div>
                          <small>
                            {isJapanese
                              ? "応募者"
                              : "Applicant"}
                          </small>

                          <h3>
                            {
                              application
                                .applicant_name
                            }
                          </h3>

                          <a
                            href={`mailto:${application.applicant_email}`}
                          >
                            {
                              application
                                .applicant_email
                            }
                          </a>
                        </div>

                        {matchScore !==
                          null &&
                          matchScore !==
                            undefined && (
                          <div className="compact-match-score">
                            <strong>
                              {matchScore}%
                            </strong>

                            <small>
                              {isJapanese
                                ? "適合度"
                                : "Match"}
                            </small>
                          </div>
                        )}
                      </section>
                    )}

                    {isCompany && (
                      <MatchPanel
                        analysis={
                          matchAnalysis
                        }
                        score={matchScore}
                        isJapanese={
                          isJapanese
                        }
                        language={language}
                      />
                    )}

                    {application
                      .cover_letter && (
                      <details className="application-cover-letter">
                        <summary>
                          {isJapanese
                            ? "カバーレターを見る"
                            : "View cover letter"}
                        </summary>

                        <p>
                          {
                            application
                              .cover_letter
                          }
                        </p>
                      </details>
                    )}

                    <div className="professional-application-actions">
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() =>
                          navigate(
                            `/jobs/${application.job}`,
                          )
                        }
                      >
                        {isJapanese
                          ? "求人を見る"
                          : "View job"}
                      </button>

                      {application.resume && (
                        <a
                          className="secondary-button"
                          href={
                            application.resume
                          }
                          target="_blank"
                          rel="noreferrer"
                        >
                          {isJapanese
                            ? "履歴書を見る"
                            : "View resume"}
                        </a>
                      )}

                      {!isCompany &&
                        ![
                          "accepted",
                          "rejected",
                          "withdrawn",
                        ].includes(
                          application.status,
                        ) && (
                          <button
                            className="delete-button"
                            type="button"
                            disabled={
                              isWithdrawing
                            }
                            onClick={() =>
                              withdrawApplication(
                                application.id,
                              )
                            }
                          >
                            {isWithdrawing
                              ? (
                                isJapanese
                                  ? "処理中..."
                                  : "Withdrawing..."
                              )
                              : (
                                isJapanese
                                  ? "応募を辞退"
                                  : "Withdraw"
                              )}
                          </button>
                        )}

                      {isCompany &&
                        application.status !==
                          "withdrawn" && (
                          <label className="professional-status-control">
                            <span>
                              {isJapanese
                                ? "選考ステータス"
                                : "Hiring status"}
                            </span>

                            <select
                              value={
                                application.status
                              }
                              disabled={
                                isUpdating
                              }
                              onChange={(
                                event,
                              ) =>
                                updateStatus(
                                  application.id,
                                  event.target
                                    .value,
                                )
                              }
                            >
                              {companyStatusOptions.map(
                                (
                                  status,
                                ) => (
                                  <option
                                    value={
                                      status
                                    }
                                    key={
                                      status
                                    }
                                  >
                                    {
                                      statusLabels[
                                        language
                                      ][
                                        status
                                      ]
                                    }
                                  </option>
                                ),
                              )}
                            </select>
                          </label>
                        )}
                    </div>
                  </article>
                );
              },
            )}
          </div>
        ) : (
          <section className="applications-empty-state">
            <span aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path d="M6 3h12v18H6z" />
                <path d="M9 8h6" />
                <path d="M9 12h6" />
              </svg>
            </span>

            <h2>
              {activeFilter === "all"
                ? (
                  isCompany
                    ? (
                      isJapanese
                        ? "応募者はまだいません"
                        : "No applications yet"
                    )
                    : (
                      isJapanese
                        ? "まだ求人に応募していません"
                        : "No applications yet"
                    )
                )
                : (
                  isJapanese
                    ? "このステータスの応募はありません"
                    : "No applications match this status"
                )}
            </h2>

            <p>
              {activeFilter === "all"
                ? (
                  isCompany
                    ? (
                      isJapanese
                        ? "求人が公開されると応募者がここに表示されます。"
                        : "Applicants will appear here after they apply to your jobs."
                    )
                    : (
                      isJapanese
                        ? "求人を探して最初の応募を始めましょう。"
                        : "Browse jobs and start your first application."
                    )
                )
                : (
                  isJapanese
                    ? "別のステータスを選択してください。"
                    : "Choose another status filter."
                )}
            </p>

            {activeFilter === "all" && (
              <button
                className="primary-button"
                type="button"
                onClick={() =>
                  navigate(
                    isCompany
                      ? "/my-jobs"
                      : "/jobs",
                  )
                }
              >
                {isCompany
                  ? (
                    isJapanese
                      ? "求人を管理"
                      : "Manage jobs"
                  )
                  : (
                    isJapanese
                      ? "求人を探す"
                      : "Browse jobs"
                  )}
              </button>
            )}
          </section>
        )}
      </section>
    </main>
  );
}

export default Applications;