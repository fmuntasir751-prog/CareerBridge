import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import DashboardHeader from "../components/DashboardHeader";
import api, { getApiErrorMessage } from "../services/api";

function SavedJobIcon({ name }) {
  const icons = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-4-4" />
      </>
    ),
    bookmark: <path d="M6 3h12v18l-6-4-6 4V3z" />,
    location: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 0 1 16 0z" />
        <circle cx="12" cy="10" r="2" />
      </>
    ),
    workplace: (
      <>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </>
    ),
    salary: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12h8" />
      </>
    ),
    remove: <path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15" />,
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      {icons[name]}
    </svg>
  );
}

function SavedJobs() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isJapanese = i18n.language.startsWith("ja");
  const locale = isJapanese ? "ja-JP" : "en-US";

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("saved");

  useEffect(() => {
    let active = true;

    async function loadSavedJobs() {
      try {
        const { data } = await api.get("/jobs/saved/");

        if (active) {
          setJobs(data);
          setError("");
        }
      } catch (requestError) {
        if (active) {
          setError(
            getApiErrorMessage(
              requestError,
              isJapanese
                ? "保存した求人を読み込めませんでした。"
                : "Could not load your saved jobs.",
            ),
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSavedJobs();

    return () => {
      active = false;
    };
  }, [isJapanese]);

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matchingJobs = query
      ? jobs.filter((job) =>
          [
            job.title_en,
            job.title_ja,
            job.company_name,
            job.location,
            job.requirements,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query),
        )
      : [...jobs];

    return matchingJobs.sort((first, second) => {
      if (sortBy === "deadline") {
        if (!first.deadline && !second.deadline) return 0;
        if (!first.deadline) return 1;
        if (!second.deadline) return -1;

        return new Date(first.deadline) - new Date(second.deadline);
      }

      if (sortBy === "salary") {
        return (
          Number(second.salary_max || second.salary_min || 0) -
          Number(first.salary_max || first.salary_min || 0)
        );
      }

      return (
        new Date(second.saved_at || second.created_at) -
        new Date(first.saved_at || first.created_at)
      );
    });
  }, [jobs, search, sortBy]);

  function getTitle(job) {
    return isJapanese && job.title_ja ? job.title_ja : job.title_en;
  }

  async function removeSavedJob(job) {
    const title = getTitle(job);
    const confirmed = window.confirm(
      isJapanese
        ? `「${title}」を保存済み求人から削除しますか？`
        : `Remove "${title}" from your saved jobs?`,
    );

    if (!confirmed) return;

    setError("");
    setRemovingId(job.id);

    try {
      await api.delete(`/jobs/${job.id}/save/`);
      setJobs((current) => current.filter((item) => item.id !== job.id));
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
  }

  function formatSalary(job) {
    const formatter = new Intl.NumberFormat(locale);
    const min = job.salary_min ? `¥${formatter.format(job.salary_min)}` : "";
    const max = job.salary_max ? `¥${formatter.format(job.salary_max)}` : "";

    if (min && max) return `${min} – ${max}`;
    if (min) return isJapanese ? `${min}～` : `From ${min}`;
    if (max) return isJapanese ? `～${max}` : `Up to ${max}`;

    return isJapanese ? "給与情報なし" : "Salary not specified";
  }

  function formatDeadline(deadline) {
    if (!deadline) return isJapanese ? "期限なし" : "No deadline";

    return new Date(`${deadline}T00:00:00`).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function getDaysRemaining(deadline) {
    if (!deadline) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(`${deadline}T00:00:00`);

    return Math.ceil((deadlineDate - today) / 86_400_000);
  }

  if (loading) {
    return (
      <div className="page-loading" role="status">
        {isJapanese ? "読み込み中..." : "Loading..."}
      </div>
    );
  }

  return (
    <main className="saved-jobs-page">
      <DashboardHeader role="student" />

      <section className="saved-jobs-content">
        <div className="saved-jobs-heading">
          <div>
            <p className="eyebrow">
              {isJapanese ? "求人コレクション" : "Job collection"}
            </p>
            <h1>{isJapanese ? "保存した求人" : "Saved jobs"}</h1>
            <p>
              {isJapanese
                ? "興味のある求人を比較し、応募の準備を進めましょう。"
                : "Compare opportunities and prepare your next application."}
            </p>
          </div>

          <div className="saved-jobs-total">
            <strong>{jobs.length}</strong>
            <span>
              {isJapanese ? "保存済み" : jobs.length === 1 ? "Saved job" : "Saved jobs"}
            </span>
          </div>
        </div>

        {error && (
          <div className="form-message error" role="alert">
            {error}
          </div>
        )}

        {jobs.length > 0 && (
          <div className="saved-jobs-toolbar">
            <label className="saved-job-search">
              <SavedJobIcon name="search" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={
                  isJapanese
                    ? "求人名・企業名・勤務地で検索"
                    : "Search title, company or location"
                }
                aria-label={isJapanese ? "保存した求人を検索" : "Search saved jobs"}
              />
            </label>

            <label className="saved-job-sort">
              <span>{isJapanese ? "並び替え" : "Sort by"}</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                <option value="saved">
                  {isJapanese ? "保存した順" : "Recently saved"}
                </option>
                <option value="deadline">
                  {isJapanese ? "締切日の近い順" : "Application deadline"}
                </option>
                <option value="salary">
                  {isJapanese ? "給与の高い順" : "Highest salary"}
                </option>
              </select>
            </label>
          </div>
        )}

        {filteredJobs.length > 0 ? (
          <div className="saved-job-grid">
            {filteredJobs.map((job) => {
              const title = getTitle(job);
              const daysRemaining = getDaysRemaining(job.deadline);
              const isRemoving = removingId === job.id;
              const isUrgent = daysRemaining !== null && daysRemaining <= 7;

              return (
                <article className="saved-job-card" key={job.id}>
                  <div className="saved-job-card-top">
                    <span className="saved-job-badge">
                      <SavedJobIcon name="bookmark" />
                      {isJapanese ? "保存済み" : "Saved"}
                    </span>

                    {job.company_verified && (
                      <span className="saved-company-verified">
                        ✓ {isJapanese ? "認証済み" : "Verified"}
                      </span>
                    )}
                  </div>

                  <h2>{title}</h2>
                  <p className="saved-job-company">{job.company_name || job.company}</p>

                  <div className="saved-job-meta">
                    <span>
                      <SavedJobIcon name="location" />
                      {job.location}
                    </span>
                    <span>
                      <SavedJobIcon name="workplace" />
                      {job.workplace_type}
                    </span>
                    <span>
                      <SavedJobIcon name="salary" />
                      {formatSalary(job)}
                    </span>
                  </div>

                  <div className={`saved-job-deadline${isUrgent ? " urgent" : ""}`}>
                    <div>
                      <small>{isJapanese ? "応募期限" : "Application deadline"}</small>
                      <strong>{formatDeadline(job.deadline)}</strong>
                    </div>

                    {daysRemaining !== null && daysRemaining >= 0 && (
                      <span>
                        {isJapanese
                          ? `あと${daysRemaining}日`
                          : `${daysRemaining} ${daysRemaining === 1 ? "day" : "days"} left`}
                      </span>
                    )}
                  </div>

                  <div className="saved-job-actions">
                    <button
                      className="primary-button"
                      type="button"
                      onClick={() => navigate(`/jobs/${job.id}`)}
                    >
                      {isJapanese ? "詳細を見る" : "View details"}
                    </button>

                    <button
                      className="saved-job-remove"
                      type="button"
                      disabled={isRemoving}
                      onClick={() => removeSavedJob(job)}
                      aria-label={
                        isJapanese
                          ? `${title}を保存済み求人から削除`
                          : `Remove ${title} from saved jobs`
                      }
                    >
                      {isRemoving ? (
                        isJapanese ? "削除中..." : "Removing..."
                      ) : (
                        <>
                          <SavedJobIcon name="remove" />
                          {isJapanese ? "削除" : "Remove"}
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
              <SavedJobIcon name="search" />
            </span>
            <h2>{isJapanese ? "一致する求人がありません" : "No matching saved jobs"}</h2>
            <p>{isJapanese ? "検索条件を変更してください。" : "Try a different search term."}</p>
            <button
              className="secondary-button"
              type="button"
              onClick={() => setSearch("")}
            >
              {isJapanese ? "検索をクリア" : "Clear search"}
            </button>
          </section>
        ) : !error && (
          <section className="saved-jobs-empty">
            <span aria-hidden="true">
              <SavedJobIcon name="bookmark" />
            </span>
            <h2>{isJapanese ? "保存した求人はまだありません" : "No saved jobs yet"}</h2>
            <p>
              {isJapanese
                ? "興味のある求人を保存すると、ここで比較できます。"
                : "Save interesting opportunities to compare them here."}
            </p>
            <button
              className="primary-button"
              type="button"
              onClick={() => navigate("/jobs")}
            >
              {isJapanese ? "求人を探す" : "Browse jobs"}
            </button>
          </section>
        )}
      </section>
    </main>
  );
}

export default SavedJobs;