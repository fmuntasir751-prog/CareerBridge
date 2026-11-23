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

function SavedJobs() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  const isJapanese =
    i18n.language.startsWith("ja");

  const [jobs, setJobs] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    removingId,
    setRemovingId,
  ] = useState(null);

  const [search, setSearch] =
    useState("");

  const [sortBy, setSortBy] =
    useState("saved");

  useEffect(() => {
    const loadSavedJobs = async () => {
      try {
        const response = await api.get(
          "/jobs/saved/",
        );

        setJobs(response.data);
      } catch (requestError) {
        setError(
          getApiErrorMessage(
            requestError,
            isJapanese
              ? "保存した求人を読み込めませんでした。"
              : "Could not load your saved jobs.",
          ),
        );
      } finally {
        setLoading(false);
      }
    };

    loadSavedJobs();
  }, [isJapanese]);

  const filteredJobs = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    const matchingJobs =
      normalizedSearch
        ? jobs.filter((job) => {
            const searchableText = [
              job.title_en,
              job.title_ja,
              job.company_name,
              job.location,
              job.requirements,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

            return searchableText.includes(
              normalizedSearch,
            );
          })
        : [...jobs];

    return matchingJobs.sort(
      (firstJob, secondJob) => {
        if (sortBy === "deadline") {
          if (!firstJob.deadline) {
            return 1;
          }

          if (!secondJob.deadline) {
            return -1;
          }

          return (
            new Date(firstJob.deadline) -
            new Date(secondJob.deadline)
          );
        }

        if (sortBy === "salary") {
          return (
            Number(
              secondJob.salary_max ||
              secondJob.salary_min ||
              0,
            ) -
            Number(
              firstJob.salary_max ||
              firstJob.salary_min ||
              0,
            )
          );
        }

        return (
          new Date(
            secondJob.saved_at ||
            secondJob.created_at,
          ) -
          new Date(
            firstJob.saved_at ||
            firstJob.created_at,
          )
        );
      },
    );
  }, [jobs, search, sortBy]);

  const removeSavedJob = async (
    job,
  ) => {
    const title =
      isJapanese && job.title_ja
        ? job.title_ja
        : job.title_en;

    const confirmed = window.confirm(
      isJapanese
        ? `「${title}」を保存済み求人から削除しますか？`
        : `Remove "${title}" from your saved jobs?`,
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setRemovingId(job.id);

    try {
      await api.delete(
        `/jobs/${job.id}/save/`,
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
          isJapanese
            ? "保存した求人を削除できませんでした。"
            : "Could not remove the saved job.",
        ),
      );
    } finally {
      setRemovingId(null);
    }
  };

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

  const formatDeadline = (
    deadline,
  ) => {
    if (!deadline) {
      return isJapanese
        ? "期限なし"
        : "No deadline";
    }

    return new Date(
      `${deadline}T00:00:00`,
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

  const getDaysRemaining = (
    deadline,
  ) => {
    if (!deadline) {
      return null;
    }

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const deadlineDate = new Date(
      `${deadline}T00:00:00`,
    );

    return Math.ceil(
      (
        deadlineDate.getTime() -
        today.getTime()
      ) /
      (1000 * 60 * 60 * 24),
    );
  };

  if (loading) {
    return (
      <div className="page-loading">
        {isJapanese
          ? "読み込み中..."
          : "Loading..."}
      </div>
    );
  }

  return (
    <main className="saved-jobs-page">
      <header className="dashboard-header">
        <a
          href="/"
          className="auth-brand"
        >
          <span>CB</span>
          CareerBridge
        </a>

        <button
          type="button"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          ←{" "}
          {isJapanese
            ? "ダッシュボード"
            : "Dashboard"}
        </button>
      </header>

      <section className="saved-jobs-content">
        <div className="saved-jobs-heading">
          <div>
            <p className="eyebrow">
              {isJapanese
                ? "求人コレクション"
                : "Job collection"}
            </p>

            <h1>
              {isJapanese
                ? "保存した求人"
                : "Saved jobs"}
            </h1>

            <p>
              {isJapanese
                ? "興味のある求人を比較し、応募の準備を進めましょう。"
                : "Compare opportunities and prepare your next application."}
            </p>
          </div>

          <div className="saved-jobs-total">
            <strong>
              {jobs.length}
            </strong>

            <span>
              {isJapanese
                ? "保存済み"
                : jobs.length === 1
                  ? "Saved job"
                  : "Saved jobs"}
            </span>
          </div>
        </div>

        {error && (
          <div
            className="form-message error"
            role="alert"
          >
            {error}
          </div>
        )}

        {jobs.length > 0 && (
          <div className="saved-jobs-toolbar">
            <label className="saved-job-search">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                aria-hidden="true"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                />
                <path d="M20 20l-4-4" />
              </svg>

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder={
                  isJapanese
                    ? "求人名・企業名・勤務地で検索"
                    : "Search title, company or location"
                }
                aria-label={
                  isJapanese
                    ? "保存した求人を検索"
                    : "Search saved jobs"
                }
              />
            </label>

            <label className="saved-job-sort">
              <span>
                {isJapanese
                  ? "並び替え"
                  : "Sort by"}
              </span>

              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(
                    event.target.value,
                  )
                }
              >
                <option value="saved">
                  {isJapanese
                    ? "保存した順"
                    : "Recently saved"}
                </option>

                <option value="deadline">
                  {isJapanese
                    ? "締切日の近い順"
                    : "Application deadline"}
                </option>

                <option value="salary">
                  {isJapanese
                    ? "給与の高い順"
                    : "Highest salary"}
                </option>
              </select>
            </label>
          </div>
        )}

        {filteredJobs.length > 0 ? (
          <div className="saved-job-grid">
            {filteredJobs.map((job) => {
              const title =
                isJapanese &&
                job.title_ja
                  ? job.title_ja
                  : job.title_en;

              const daysRemaining =
                getDaysRemaining(
                  job.deadline,
                );

              return (
                <article
                  className="saved-job-card"
                  key={job.id}
                >
                  <div className="saved-job-card-top">
                    <span className="saved-job-badge">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M6 3h12v18l-6-4-6 4V3z" />
                      </svg>

                      {isJapanese
                        ? "保存済み"
                        : "Saved"}
                    </span>

                    {job.company_verified && (
                      <span className="saved-company-verified">
                        ✓{" "}
                        {isJapanese
                          ? "認証済み"
                          : "Verified"}
                      </span>
                    )}
                  </div>

                  <h2>{title}</h2>

                  <p className="saved-job-company">
                    {job.company_name ||
                      job.company}
                  </p>

                  <div className="saved-job-meta">
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

                      {job.workplace_type}
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

                  <div
                    className={
                      `saved-job-deadline ${
                        daysRemaining !== null &&
                        daysRemaining <= 7
                          ? "urgent"
                          : ""
                      }`
                    }
                  >
                    <div>
                      <small>
                        {isJapanese
                          ? "応募期限"
                          : "Application deadline"}
                      </small>

                      <strong>
                        {formatDeadline(
                          job.deadline,
                        )}
                      </strong>
                    </div>

                    {daysRemaining !==
                      null &&
                      daysRemaining >= 0 && (
                      <span>
                        {isJapanese
                          ? `あと${daysRemaining}日`
                          : `${daysRemaining} days left`}
                      </span>
                    )}
                  </div>

                  <div className="saved-job-actions">
                    <button
                      className="primary-button"
                      type="button"
                      onClick={() =>
                        navigate(
                          `/jobs/${job.id}`,
                        )
                      }
                    >
                      {isJapanese
                        ? "詳細を見る"
                        : "View details"}
                    </button>

                    <button
                      className="saved-job-remove"
                      type="button"
                      disabled={
                        removingId === job.id
                      }
                      onClick={() =>
                        removeSavedJob(job)
                      }
                      aria-label={
                        isJapanese
                          ? `${title}を保存済み求人から削除`
                          : `Remove ${title} from saved jobs`
                      }
                    >
                      {removingId ===
                      job.id ? (
                        isJapanese
                          ? "削除中..."
                          : "Removing..."
                      ) : (
                        <>
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            aria-hidden="true"
                          >
                            <path d="M3 6h18" />
                            <path d="M8 6V4h8v2" />
                            <path d="M6 6l1 15h10l1-15" />
                          </svg>

                          {isJapanese
                            ? "削除"
                            : "Remove"}
                        </>
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : jobs.length > 0 ? (
          <section className="saved-jobs-empty">
            <span aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                />
                <path d="M20 20l-4-4" />
              </svg>
            </span>

            <h2>
              {isJapanese
                ? "一致する求人がありません"
                : "No matching saved jobs"}
            </h2>

            <p>
              {isJapanese
                ? "検索条件を変更してください。"
                : "Try a different search term."}
            </p>

            <button
              className="secondary-button"
              type="button"
              onClick={() =>
                setSearch("")
              }
            >
              {isJapanese
                ? "検索をクリア"
                : "Clear search"}
            </button>
          </section>
        ) : (
          <section className="saved-jobs-empty">
            <span aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path d="M6 3h12v18l-6-4-6 4V3z" />
              </svg>
            </span>

            <h2>
              {isJapanese
                ? "保存した求人はまだありません"
                : "No saved jobs yet"}
            </h2>

            <p>
              {isJapanese
                ? "興味のある求人を保存すると、ここで比較できます。"
                : "Save interesting opportunities to compare them here."}
            </p>

            <button
              className="primary-button"
              type="button"
              onClick={() =>
                navigate("/jobs")
              }
            >
              {isJapanese
                ? "求人を探す"
                : "Browse jobs"}
            </button>
          </section>
        )}
      </section>
    </main>
  );
}

export default SavedJobs;