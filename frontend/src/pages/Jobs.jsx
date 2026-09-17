import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import api from "../services/api";

const initialFilters = {
  search: "",
  location: "",
  workplaceType: "",
  employmentType: "",
  japaneseLevel: "",
  minimumSalary: "",
  ordering: "newest",
};

function Jobs() {
  const { t, i18n } = useTranslation();

  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] =
    useState(initialFilters);

  const [showFilters, setShowFilters] =
    useState(true);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isJapanese =
    i18n.language.startsWith("ja");

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

  const locations = useMemo(() => {
    return [
      ...new Set(
        jobs
          .map((job) => job.location)
          .filter(Boolean),
      ),
    ].sort((first, second) =>
      first.localeCompare(second),
    );
  }, [jobs]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    setFilters(initialFilters);
  };

  const filteredJobs = useMemo(() => {
    const keyword =
      filters.search.trim().toLowerCase();

    const minimumSalary = Number(
      filters.minimumSalary,
    );

    const results = jobs.filter((job) => {
      const searchableText = [
        job.title_en,
        job.title_ja,
        job.company_name,
        job.location,
        job.description_en,
        job.description_ja,
        job.requirements,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !keyword ||
        searchableText.includes(keyword);

      const matchesLocation =
        !filters.location ||
        job.location === filters.location;

      const matchesWorkplace =
        !filters.workplaceType ||
        job.workplace_type ===
          filters.workplaceType;

      const matchesEmployment =
        !filters.employmentType ||
        job.employment_type ===
          filters.employmentType;

      const matchesJapanese =
        !filters.japaneseLevel ||
        job.japanese_level ===
          filters.japaneseLevel;

      const highestSalary =
        job.salary_max || job.salary_min || 0;

      const matchesSalary =
        !minimumSalary ||
        highestSalary >= minimumSalary;

      return (
        matchesSearch &&
        matchesLocation &&
        matchesWorkplace &&
        matchesEmployment &&
        matchesJapanese &&
        matchesSalary
      );
    });

    return [...results].sort((first, second) => {
      if (filters.ordering === "salary_high") {
        return (
          (second.salary_max ||
            second.salary_min ||
            0) -
          (first.salary_max ||
            first.salary_min ||
            0)
        );
      }

      if (filters.ordering === "salary_low") {
        return (
          (first.salary_min ||
            first.salary_max ||
            0) -
          (second.salary_min ||
            second.salary_max ||
            0)
        );
      }

      if (filters.ordering === "title") {
        const firstTitle =
          isJapanese && first.title_ja
            ? first.title_ja
            : first.title_en;

        const secondTitle =
          isJapanese && second.title_ja
            ? second.title_ja
            : second.title_en;

        return firstTitle.localeCompare(
          secondTitle,
        );
      }

      return (
        new Date(second.created_at) -
        new Date(first.created_at)
      );
    });
  }, [filters, isJapanese, jobs]);

  const activeFilterCount = [
    filters.search,
    filters.location,
    filters.workplaceType,
    filters.employmentType,
    filters.japaneseLevel,
    filters.minimumSalary,
  ].filter(Boolean).length;

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

  const getWorkplaceLabel = (value) => {
    const labels = {
      onsite: isJapanese
        ? "出社"
        : "On-site",
      remote: isJapanese
        ? "リモート"
        : "Remote",
      hybrid: isJapanese
        ? "ハイブリッド"
        : "Hybrid",
    };

    return labels[value] || value;
  };

  const getEmploymentLabel = (value) => {
    const labels = {
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

    return labels[value] || value;
  };

  const getJapaneseLabel = (value) => {
    const labels = {
      not_required: isJapanese
        ? "日本語不要"
        : "Not required",
      n3: "JLPT N3",
      n2: "JLPT N2",
      n1: "JLPT N1",
    };

    return labels[value] || value;
  };

  if (loading) {
    return (
      <div className="page-loading">
        {t("loading")}
      </div>
    );
  }

  return (
    <main className="jobs-page">
      <header className="dashboard-header">
        <a href="/" className="auth-brand">
          <span>CB</span>
          CareerBridge
        </a>

        <a
          className="back-link"
          href="/dashboard"
        >
          ← {t("dashboard")}
        </a>
      </header>

      <section className="jobs-content">
        <div className="jobs-title-row">
          <div>
            <p className="eyebrow">
              {t("careerOpportunities")}
            </p>

            <h1>{t("availableJobs")}</h1>

            <p className="jobs-result-count">
              {isJapanese
                ? `${filteredJobs.length}件の求人`
                : `${filteredJobs.length} jobs found`}
            </p>
          </div>

          <button
            className="filter-toggle-button"
            type="button"
            onClick={() =>
              setShowFilters(
                (currentValue) => !currentValue,
              )
            }
          >
            ⚙️{" "}
            {isJapanese
              ? "検索条件"
              : "Filters"}

            {activeFilterCount > 0 && (
              <span>{activeFilterCount}</span>
            )}
          </button>
        </div>

        {showFilters && (
          <section className="advanced-job-filters">
            <div className="job-filter-search">
              <label htmlFor="job-search">
                {isJapanese
                  ? "キーワード"
                  : "Keyword"}
              </label>

              <input
                id="job-search"
                name="search"
                type="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder={
                  isJapanese
                    ? "職種、会社、スキルで検索"
                    : "Search role, company or skill"
                }
              />
            </div>

            <div className="job-filter-grid">
              <label>
                <span>
                  {isJapanese
                    ? "勤務地"
                    : "Location"}
                </span>

                <select
                  name="location"
                  value={filters.location}
                  onChange={handleFilterChange}
                >
                  <option value="">
                    {isJapanese
                      ? "すべての勤務地"
                      : "All locations"}
                  </option>

                  {locations.map((location) => (
                    <option
                      value={location}
                      key={location}
                    >
                      {location}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>
                  {isJapanese
                    ? "勤務形態"
                    : "Workplace"}
                </span>

                <select
                  name="workplaceType"
                  value={filters.workplaceType}
                  onChange={handleFilterChange}
                >
                  <option value="">
                    {isJapanese
                      ? "すべて"
                      : "Any workplace"}
                  </option>

                  <option value="onsite">
                    {isJapanese
                      ? "出社"
                      : "On-site"}
                  </option>

                  <option value="remote">
                    {isJapanese
                      ? "リモート"
                      : "Remote"}
                  </option>

                  <option value="hybrid">
                    {isJapanese
                      ? "ハイブリッド"
                      : "Hybrid"}
                  </option>
                </select>
              </label>

              <label>
                <span>
                  {isJapanese
                    ? "雇用形態"
                    : "Employment type"}
                </span>

                <select
                  name="employmentType"
                  value={filters.employmentType}
                  onChange={handleFilterChange}
                >
                  <option value="">
                    {isJapanese
                      ? "すべて"
                      : "Any employment type"}
                  </option>

                  <option value="full_time">
                    {isJapanese
                      ? "正社員"
                      : "Full-time"}
                  </option>

                  <option value="part_time">
                    {isJapanese
                      ? "パートタイム"
                      : "Part-time"}
                  </option>

                  <option value="internship">
                    {isJapanese
                      ? "インターンシップ"
                      : "Internship"}
                  </option>

                  <option value="contract">
                    {isJapanese
                      ? "契約社員"
                      : "Contract"}
                  </option>
                </select>
              </label>

              <label>
                <span>
                  {isJapanese
                    ? "日本語レベル"
                    : "Japanese level"}
                </span>

                <select
                  name="japaneseLevel"
                  value={filters.japaneseLevel}
                  onChange={handleFilterChange}
                >
                  <option value="">
                    {isJapanese
                      ? "すべて"
                      : "Any level"}
                  </option>

                  <option value="not_required">
                    {isJapanese
                      ? "日本語不要"
                      : "Not required"}
                  </option>

                  <option value="n3">
                    JLPT N3
                  </option>

                  <option value="n2">
                    JLPT N2
                  </option>

                  <option value="n1">
                    JLPT N1
                  </option>
                </select>
              </label>

              <label>
                <span>
                  {isJapanese
                    ? "最低希望月給"
                    : "Minimum monthly salary"}
                </span>

                <input
                  name="minimumSalary"
                  type="number"
                  min="0"
                  step="10000"
                  value={filters.minimumSalary}
                  onChange={handleFilterChange}
                  placeholder="250000"
                />
              </label>

              <label>
                <span>
                  {isJapanese
                    ? "並び順"
                    : "Sort by"}
                </span>

                <select
                  name="ordering"
                  value={filters.ordering}
                  onChange={handleFilterChange}
                >
                  <option value="newest">
                    {isJapanese
                      ? "新着順"
                      : "Newest first"}
                  </option>

                  <option value="salary_high">
                    {isJapanese
                      ? "給与が高い順"
                      : "Highest salary"}
                  </option>

                  <option value="salary_low">
                    {isJapanese
                      ? "給与が低い順"
                      : "Lowest salary"}
                  </option>

                  <option value="title">
                    {isJapanese
                      ? "職種名順"
                      : "Job title"}
                  </option>
                </select>
              </label>
            </div>

            <div className="job-filter-actions">
              <button
                type="button"
                onClick={clearFilters}
                disabled={
                  activeFilterCount === 0 &&
                  filters.ordering === "newest"
                }
              >
                {isJapanese
                  ? "条件をクリア"
                  : "Clear filters"}
              </button>
            </div>
          </section>
        )}

        {error && (
          <div className="form-message error">
            {error}
          </div>
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
              <article
                className="job-card"
                key={job.id}
              >
                <div className="job-card-top">
                  <span>{job.company_name}</span>

                  <span>
                    {getWorkplaceLabel(
                      job.workplace_type,
                    )}
                  </span>
                </div>

                <h2>{title}</h2>
                <p>{description}</p>

                <div className="job-meta">
                  <span>
                    📍 {job.location}
                  </span>

                  <span>
                    💼{" "}
                    {getEmploymentLabel(
                      job.employment_type,
                    )}
                  </span>

                  <span>
                    🗣️{" "}
                    {getJapaneseLabel(
                      job.japanese_level,
                    )}
                  </span>
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
          <div className="empty-message">
            <h2>
              {isJapanese
                ? "求人が見つかりません"
                : "No jobs found"}
            </h2>

            <p>
              {isJapanese
                ? "検索条件を変更してもう一度お試しください。"
                : "Change or clear some filters and try again."}
            </p>

            <button
              type="button"
              onClick={clearFilters}
            >
              {isJapanese
                ? "検索条件をクリア"
                : "Clear filters"}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

export default Jobs;