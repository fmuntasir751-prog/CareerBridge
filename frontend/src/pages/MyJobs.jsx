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
function MyJobs() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const isJapanese =
    i18n.language.startsWith("ja");

  const [jobs, setJobs] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [
    updatingId,
    setUpdatingId,
  ] = useState(null);

  const [deletingId, setDeletingId] =
    useState(null);

  const [activeFilter, setActiveFilter] =
    useState("all");

  const [error, setError] =
    useState("");

  const statusLabels = {
    draft: isJapanese
      ? "下書き"
      : "Draft",
    published: isJapanese
      ? "公開中"
      : "Published",
    closed: isJapanese
      ? "募集終了"
      : "Closed",
    expired: isJapanese
      ? "募集期限終了"
      : "Expired",
  };

  const employmentLabels = {
    full_time: isJapanese
      ? "正社員"
      : "Full-time",
    part_time: isJapanese
      ? "パートタイム"
      : "Part-time",
    internship: isJapanese
      ? "インターンシップ"
      : "Internship",
    contract: isJapanese
      ? "契約社員"
      : "Contract",
  };

  const workplaceLabels = {
    onsite: isJapanese
      ? "出社勤務"
      : "On-site",
    remote: isJapanese
      ? "リモート"
      : "Remote",
    hybrid: isJapanese
      ? "ハイブリッド"
      : "Hybrid",
  };

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const response = await api.get(
          "/jobs/mine/",
        );

        setJobs(response.data);
      } catch (requestError) {
        setError(
          getApiErrorMessage(
            requestError,
            t("myJobsLoadError"),
          ),
        );
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, [t]);

  const getEffectiveStatus = (job) =>
    job.effective_status ||
    job.status ||
    (
      job.is_active
        ? "published"
        : "closed"
    );

  const jobCounts = useMemo(() => {
    const counts = {
      all: jobs.length,
      published: 0,
      draft: 0,
      closed: 0,
      expired: 0,
    };

    jobs.forEach((job) => {
      const status =
        getEffectiveStatus(job);

      if (
        Object.prototype.hasOwnProperty.call(
          counts,
          status,
        )
      ) {
        counts[status] += 1;
      }
    });

    return counts;
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    if (activeFilter === "all") {
      return jobs;
    }

    return jobs.filter(
      (job) =>
        getEffectiveStatus(job) ===
        activeFilter,
    );
  }, [activeFilter, jobs]);

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return isJapanese
        ? "設定なし"
        : "Not set";
    }

    return new Date(
      `${dateValue}T00:00:00`,
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
  };

  const formatCreatedDate = (
    dateValue,
  ) =>
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

  const formatSalary = (job) => {
    const formatter =
      new Intl.NumberFormat(
        isJapanese
          ? "ja-JP"
          : "en-US",
      );

    if (
      job.salary_min &&
      job.salary_max
    ) {
      return (
        `¥${formatter.format(
          job.salary_min,
        )} – ¥${formatter.format(
          job.salary_max,
        )}`
      );
    }

    if (job.salary_min) {
      return isJapanese
        ? (
          `¥${formatter.format(
            job.salary_min,
          )}～`
        )
        : (
          `From ¥${formatter.format(
            job.salary_min,
          )}`
        );
    }

    if (job.salary_max) {
      return isJapanese
        ? (
          `～¥${formatter.format(
            job.salary_max,
          )}`
        )
        : (
          `Up to ¥${formatter.format(
            job.salary_max,
          )}`
        );
    }

    return isJapanese
      ? "給与情報なし"
      : "Salary not specified";
  };

  const updateJobStatus = async (
    job,
    nextStatus,
  ) => {
    setError("");
    setUpdatingId(job.id);

    try {
      const response = await api.patch(
        `/jobs/${job.id}/`,
        {
          status: nextStatus,
        },
      );

      setJobs((currentJobs) =>
        currentJobs.map((currentJob) =>
          currentJob.id === job.id
            ? response.data
            : currentJob,
        ),
      );
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          t("jobUpdateError"),
        ),
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteJob = async (job) => {
    const confirmed = window.confirm(
      isJapanese
        ? (
          `「${job.title_ja ||
          job.title_en}」を削除しますか？`
        )
        : (
          `Delete "${
            job.title_en
          }"? This action cannot be undone.`
        ),
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setDeletingId(job.id);

    try {
      await api.delete(
        `/jobs/${job.id}/`,
      );

      setJobs((currentJobs) =>
        currentJobs.filter(
          (currentJob) =>
            currentJob.id !== job.id,
        ),
      );
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          t("jobDeleteError"),
        ),
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        {t("loading")}
      </div>
    );
  }

  const filters = [
    {
      key: "all",
      label: isJapanese
        ? "すべて"
        : "All jobs",
    },
    {
      key: "published",
      label: isJapanese
        ? "公開中"
        : "Published",
    },
    {
      key: "draft",
      label: isJapanese
        ? "下書き"
        : "Drafts",
    },
    {
      key: "closed",
      label: isJapanese
        ? "募集終了"
        : "Closed",
    },
    {
      key: "expired",
      label: isJapanese
        ? "期限終了"
        : "Expired",
    },
  ];

  return (
    <main className="my-jobs-page">
    <DashboardHeader role="company" />
      <section className="my-jobs-content">
        <div className="my-jobs-heading">
          <div>
            <p className="eyebrow">
              {isJapanese
                ? "採用管理"
                : "Recruitment management"}
            </p>

            <h1>
              {t("myPostedJobs")}
            </h1>

            <p>
              {isJapanese
                ? (
                  "求人の公開状態、応募期限、"
                  + "採用情報を一か所で管理できます。"
                )
                : (
                  "Manage job status, deadlines "
                  + "and recruitment activity in one place."
                )}
            </p>
          </div>

          <button
            className="primary-button"
            type="button"
            onClick={() =>
              navigate("/jobs/new")
            }
          >
            <span aria-hidden="true">
              +
            </span>

            {t("postJob")}
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

        <section className="job-summary-grid">
          <article>
            <span
              className="job-summary-icon all"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <rect
                  x="3"
                  y="5"
                  width="18"
                  height="16"
                  rx="2"
                />
                <path d="M8 5V3h8v2" />
                <path d="M3 11h18" />
              </svg>
            </span>

            <div>
              <small>
                {isJapanese
                  ? "すべての求人"
                  : "Total jobs"}
              </small>

              <strong>
                {jobCounts.all}
              </strong>
            </div>
          </article>

          <article>
            <span
              className="job-summary-icon published"
              aria-hidden="true"
            >
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
            </span>

            <div>
              <small>
                {isJapanese
                  ? "公開中"
                  : "Published"}
              </small>

              <strong>
                {jobCounts.published}
              </strong>
            </div>
          </article>

          <article>
            <span
              className="job-summary-icon draft"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path d="M4 20h4l11-11-4-4L4 16v4z" />
                <path d="M13 7l4 4" />
              </svg>
            </span>

            <div>
              <small>
                {isJapanese
                  ? "下書き"
                  : "Drafts"}
              </small>

              <strong>
                {jobCounts.draft}
              </strong>
            </div>
          </article>

          <article>
            <span
              className="job-summary-icon closed"
              aria-hidden="true"
            >
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
                <path d="M8 12h8" />
              </svg>
            </span>

            <div>
              <small>
                {isJapanese
                  ? "終了・期限切れ"
                  : "Closed / expired"}
              </small>

              <strong>
                {jobCounts.closed +
                  jobCounts.expired}
              </strong>
            </div>
          </article>
        </section>

        <div className="my-jobs-toolbar">
          <div
            className="job-status-filters"
            role="group"
            aria-label={
              isJapanese
                ? "求人ステータス"
                : "Job status filters"
            }
          >
            {filters.map((filter) => (
              <button
                className={
                  activeFilter ===
                  filter.key
                    ? "active"
                    : ""
                }
                type="button"
                key={filter.key}
                onClick={() =>
                  setActiveFilter(
                    filter.key,
                  )
                }
              >
                {filter.label}

                <span>
                  {jobCounts[filter.key]}
                </span>
              </button>
            ))}
          </div>

          <p>
            {isJapanese
              ? (
                `${filteredJobs.length}件の求人`
              )
              : (
                `${filteredJobs.length} ${
                  filteredJobs.length === 1
                    ? "job"
                    : "jobs"
                }`
              )}
          </p>
        </div>

        {filteredJobs.length > 0 ? (
          <div className="my-job-list">
            {filteredJobs.map((job) => {
              const title =
                isJapanese &&
                job.title_ja
                  ? job.title_ja
                  : job.title_en;

              const effectiveStatus =
                getEffectiveStatus(job);

              const isUpdating =
                updatingId === job.id;

              const isDeleting =
                deletingId === job.id;

              return (
                <article
                  className="my-job-card"
                  key={job.id}
                >
                  <div className="my-job-card-main">
                    <div className="my-job-card-top">
                      <span
                        className={
                          `job-lifecycle-badge ${
                            effectiveStatus
                          }`
                        }
                      >
                        {statusLabels[
                          effectiveStatus
                        ] ||
                          effectiveStatus}
                      </span>

                      <small>
                        {isJapanese
                          ? "作成日"
                          : "Created"}{" "}
                        {formatCreatedDate(
                          job.created_at,
                        )}
                      </small>
                    </div>

                    <h2>{title}</h2>

                    <div className="my-job-meta">
                      <span>
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1116 0z" />
                          <circle
                            cx="12"
                            cy="10"
                            r="2"
                          />
                        </svg>

                        {job.location}
                      </span>

                      <span>
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <rect
                            x="3"
                            y="7"
                            width="18"
                            height="13"
                            rx="2"
                          />
                          <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>

                        {
                          workplaceLabels[
                            job.workplace_type
                          ]
                        }
                      </span>

                      <span>
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
                          <path d="M8 12h8" />
                        </svg>

                        {formatSalary(job)}
                      </span>
                    </div>

                    <div className="my-job-tags">
                      <span>
                        {
                          employmentLabels[
                            job.employment_type
                          ]
                        }
                      </span>

                      <span>
                        {job.japanese_level ===
                        "not_required"
                          ? (
                            isJapanese
                              ? "日本語不問"
                              : "Japanese not required"
                          )
                          : job.japanese_level
                              .toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="my-job-card-side">
                    <div className="my-job-deadline">
                      <small>
                        {isJapanese
                          ? "応募期限"
                          : "Application deadline"}
                      </small>

                      <strong>
                        {formatDate(
                          job.deadline,
                        )}
                      </strong>

                      <span
                        className={
                          job.accepts_applications
                            ? "accepting"
                            : "not-accepting"
                        }
                      >
                        {job.accepts_applications
                          ? (
                            isJapanese
                              ? "応募受付中"
                              : "Accepting applications"
                          )
                          : (
                            isJapanese
                              ? "応募停止中"
                              : "Applications closed"
                          )}
                      </span>
                    </div>

                    <div className="my-job-actions">
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() =>
                          navigate(
                            `/jobs/${job.id}/edit`,
                          )
                        }
                      >
                        {t("editJob")}
                      </button>

                      {effectiveStatus ===
                        "published" && (
                        <button
                          className="secondary-button"
                          type="button"
                          onClick={() =>
                            navigate(
                              `/jobs/${job.id}`,
                            )
                          }
                        >
                          {t("viewDetails")}
                        </button>
                      )}

                      {effectiveStatus ===
                        "draft" && (
                        <button
                          className="status-button"
                          type="button"
                          disabled={
                            isUpdating
                          }
                          onClick={() =>
                            updateJobStatus(
                              job,
                              "published",
                            )
                          }
                        >
                          {isUpdating
                            ? (
                              isJapanese
                                ? "公開中..."
                                : "Publishing..."
                            )
                            : (
                              isJapanese
                                ? "公開"
                                : "Publish"
                            )}
                        </button>
                      )}

                      {effectiveStatus ===
                        "published" && (
                        <button
                          className="job-close-button"
                          type="button"
                          disabled={
                            isUpdating
                          }
                          onClick={() =>
                            updateJobStatus(
                              job,
                              "closed",
                            )
                          }
                        >
                          {isUpdating
                            ? (
                              isJapanese
                                ? "終了中..."
                                : "Closing..."
                            )
                            : (
                              isJapanese
                                ? "募集終了"
                                : "Close job"
                            )}
                        </button>
                      )}

                      {effectiveStatus ===
                        "closed" && (
                        <button
                          className="status-button"
                          type="button"
                          disabled={
                            isUpdating
                          }
                          onClick={() =>
                            updateJobStatus(
                              job,
                              "published",
                            )
                          }
                        >
                          {isUpdating
                            ? (
                              isJapanese
                                ? "再公開中..."
                                : "Publishing..."
                            )
                            : (
                              isJapanese
                                ? "再公開"
                                : "Republish"
                            )}
                        </button>
                      )}

                      {effectiveStatus ===
                        "expired" && (
                        <button
                          className="status-button"
                          type="button"
                          onClick={() =>
                            navigate(
                              `/jobs/${job.id}/edit`,
                            )
                          }
                        >
                          {isJapanese
                            ? "締切日を更新"
                            : "Update deadline"}
                        </button>
                      )}

                      <button
                        className="delete-button"
                        type="button"
                        disabled={isDeleting}
                        onClick={() =>
                          deleteJob(job)
                        }
                      >
                        {isDeleting
                          ? (
                            isJapanese
                              ? "削除中..."
                              : "Deleting..."
                          )
                          : t("delete")}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <section className="my-jobs-empty">
            <span aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <rect
                  x="3"
                  y="5"
                  width="18"
                  height="16"
                  rx="2"
                />
                <path d="M8 5V3h8v2" />
                <path d="M8 13h8" />
              </svg>
            </span>

            <h2>
              {activeFilter === "all"
                ? t("noPostedJobs")
                : (
                  isJapanese
                    ? "このステータスの求人はありません"
                    : "No jobs match this status"
                )}
            </h2>

            <p>
              {activeFilter === "all"
                ? (
                  isJapanese
                    ? "最初の求人を作成して採用活動を始めましょう。"
                    : "Create your first job and start recruiting."
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
                  navigate("/jobs/new")
                }
              >
                {t("postJob")}
              </button>
            )}
          </section>
        )}
      </section>
    </main>
  );
}

export default MyJobs;