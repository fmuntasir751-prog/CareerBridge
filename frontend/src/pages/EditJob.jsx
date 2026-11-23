import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import api, {
  getApiErrorMessage,
} from "../services/api";

const emptyJob = {
  title_en: "",
  title_ja: "",
  description_en: "",
  description_ja: "",
  requirements: "",
  location: "",
  employment_type: "full_time",
  workplace_type: "onsite",
  japanese_level: "not_required",
  salary_min: "",
  salary_max: "",
  deadline: "",
  status: "draft",
  effective_status: "draft",
  accepts_applications: false,
};

function getTodayValue() {
  const today = new Date();

  const year = today.getFullYear();

  const month = String(
    today.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    today.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normalizeJob(data) {
  return {
    ...emptyJob,
    ...data,
    salary_min:
      data.salary_min ?? "",
    salary_max:
      data.salary_max ?? "",
    deadline:
      data.deadline ?? "",
    status:
      data.status || "draft",
    effective_status:
      data.effective_status ||
      data.status ||
      "draft",
  };
}

function EditJob() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const isJapanese =
    i18n.language.startsWith("ja");

  const [job, setJob] =
    useState(emptyJob);

  const [
    companyProfile,
    setCompanyProfile,
  ] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [
    savingAction,
    setSavingAction,
  ] = useState("");

  const [message, setMessage] =
    useState("");

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

  useEffect(() => {
    const loadPage = async () => {
      try {
        const [
          jobResponse,
          profileResponse,
        ] = await Promise.all([
          api.get(`/jobs/${id}/`),
          api.get(
            "/profiles/company/me/",
          ),
        ]);

        setJob(
          normalizeJob(jobResponse.data),
        );

        setCompanyProfile(
          profileResponse.data,
        );
      } catch (requestError) {
        setError(
          getApiErrorMessage(
            requestError,
            t("jobLoadError"),
          ),
        );
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [id, t]);

  const handleChange = (event) => {
    const { name, value } =
      event.target;

    setJob((currentJob) => ({
      ...currentJob,
      [name]: value,
    }));
  };

  const checklist = useMemo(
    () => [
      {
        key: "title",
        label: isJapanese
          ? "英語の求人タイトル"
          : "English job title",
        complete: Boolean(
          job.title_en.trim(),
        ),
      },
      {
        key: "description",
        label: isJapanese
          ? "英語の仕事内容"
          : "English job description",
        complete: Boolean(
          job.description_en.trim(),
        ),
      },
      {
        key: "requirements",
        label: isJapanese
          ? "応募条件・必要スキル"
          : "Requirements and skills",
        complete: Boolean(
          job.requirements.trim(),
        ),
      },
      {
        key: "location",
        label: isJapanese
          ? "勤務地"
          : "Job location",
        complete: Boolean(
          job.location.trim(),
        ),
      },
      {
        key: "salary",
        label: isJapanese
          ? "給与情報"
          : "Salary information",
        complete: Boolean(
          job.salary_min ||
          job.salary_max,
        ),
      },
      {
        key: "deadline",
        label: isJapanese
          ? "応募期限"
          : "Application deadline",
        complete: Boolean(
          job.deadline,
        ),
      },
    ],
    [isJapanese, job],
  );

  const completedCount =
    checklist.filter(
      (item) => item.complete,
    ).length;

  const completionPercentage =
    Math.round(
      (
        completedCount /
        checklist.length
      ) * 100,
    );

  const formatSalary = () => {
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
          Number(job.salary_min),
        )} – ¥${formatter.format(
          Number(job.salary_max),
        )}`
      );
    }

    if (job.salary_min) {
      return isJapanese
        ? (
          `¥${formatter.format(
            Number(job.salary_min),
          )}～`
        )
        : (
          `From ¥${formatter.format(
            Number(job.salary_min),
          )}`
        );
    }

    if (job.salary_max) {
      return isJapanese
        ? (
          `～¥${formatter.format(
            Number(job.salary_max),
          )}`
        )
        : (
          `Up to ¥${formatter.format(
            Number(job.salary_max),
          )}`
        );
    }

    return isJapanese
      ? "給与情報なし"
      : "Salary not specified";
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

  const japaneseLabels = {
    not_required: isJapanese
      ? "日本語不問"
      : "Japanese not required",
    n3: "JLPT N3",
    n2: "JLPT N2",
    n1: "JLPT N1",
  };

  const saveJob = async (
    event,
    requestedStatus = job.status,
  ) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (
      job.salary_min &&
      job.salary_max &&
      Number(job.salary_min) >
        Number(job.salary_max)
    ) {
      setError(
        isJapanese
          ? (
            "最高給与は最低給与以上に"
            + "設定してください。"
          )
          : (
            "Maximum salary must be greater "
            + "than or equal to minimum salary."
          ),
      );

      return;
    }

    if (
      requestedStatus === "published" &&
      job.deadline &&
      job.deadline < getTodayValue()
    ) {
      setError(
        isJapanese
          ? (
            "求人を公開するには、"
            + "今日以降の締切日を設定してください。"
          )
          : (
            "Set an application deadline "
            + "of today or later before publishing."
          ),
      );

      return;
    }

    setSavingAction(requestedStatus);

    const payload = {
      title_en: job.title_en,
      title_ja: job.title_ja,
      description_en:
        job.description_en,
      description_ja:
        job.description_ja,
      requirements:
        job.requirements,
      location: job.location,
      employment_type:
        job.employment_type,
      workplace_type:
        job.workplace_type,
      japanese_level:
        job.japanese_level,
      salary_min:
        job.salary_min || null,
      salary_max:
        job.salary_max || null,
      deadline:
        job.deadline || null,
      status: requestedStatus,
    };

    try {
      const response = await api.patch(
        `/jobs/${id}/`,
        payload,
      );

      setJob(
        normalizeJob(response.data),
      );

      if (
        requestedStatus === "draft"
      ) {
        setMessage(
          isJapanese
            ? "求人を下書きとして保存しました。"
            : "The job was saved as a draft.",
        );
      } else if (
        requestedStatus === "published"
      ) {
        setMessage(
          isJapanese
            ? "求人を公開しました。"
            : "The job was published successfully.",
        );
      } else if (
        requestedStatus === "closed"
      ) {
        setMessage(
          isJapanese
            ? "求人募集を終了しました。"
            : "The job was closed successfully.",
        );
      }
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          t("jobUpdateError"),
        ),
      );
    } finally {
      setSavingAction("");
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        {t("loading")}
      </div>
    );
  }

  const previewTitle =
    isJapanese && job.title_ja
      ? job.title_ja
      : job.title_en ||
        (
          isJapanese
            ? "求人タイトル"
            : "Job title"
        );

  const isSaving =
    Boolean(savingAction);

  return (
    <main className="job-editor-page">
      <header className="profile-editor-header">
        <button
          className="back-button"
          type="button"
          onClick={() =>
            navigate("/my-jobs")
          }
        >
          ←{" "}
          {isJapanese
            ? "求人管理"
            : "My jobs"}
        </button>

        <div>
          <p className="eyebrow">
            {isJapanese
              ? "求人管理"
              : "Job management"}
          </p>

          <h1>
            {isJapanese
              ? "求人情報を編集"
              : "Edit job details"}
          </h1>

          <p>
            {isJapanese
              ? (
                "求人内容、応募条件、公開状態を"
                + "管理できます。"
              )
              : (
                "Manage the job details, requirements "
                + "and publishing status."
              )}
          </p>
        </div>
      </header>

      <div className="edit-job-status-bar">
        <div>
          <span
            className={
              `job-lifecycle-badge ${
                job.effective_status
              }`
            }
          >
            {statusLabels[
              job.effective_status
            ] || job.effective_status}
          </span>

          <p>
            {job.effective_status ===
            "published"
              ? (
                isJapanese
                  ? "この求人は学生に公開されています。"
                  : "This job is currently visible to students."
              )
              : job.effective_status ===
                  "draft"
                ? (
                  isJapanese
                    ? "この求人はまだ公開されていません。"
                    : "This job has not been published yet."
                )
                : (
                  isJapanese
                    ? "現在、この求人への応募は受け付けていません。"
                    : "This job is not currently accepting applications."
                )}
          </p>
        </div>

        {job.effective_status ===
          "published" && (
          <button
            className="secondary-button"
            type="button"
            onClick={() =>
              navigate(`/jobs/${id}`)
            }
          >
            {isJapanese
              ? "公開ページを見る"
              : "View public job"}
          </button>
        )}
      </div>

      {job.effective_status ===
        "expired" && (
        <div className="job-editor-message form-message warning">
          {isJapanese
            ? (
              "募集期限が終了しています。"
              + "再公開するには新しい締切日を設定してください。"
            )
            : (
              "This job has expired. Set a new "
              + "deadline before publishing it again."
            )}
        </div>
      )}

      {message && (
        <div
          className="job-editor-message form-message success"
          role="status"
        >
          {message}
        </div>
      )}

      {error && (
        <div
          className="job-editor-message form-message error"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="job-editor-layout">
        <form
          className="job-editor-form"
          onSubmit={(event) =>
            saveJob(event, job.status)
          }
        >
          <section className="profile-editor-card">
            <div className="profile-section-heading">
              <span
                className="profile-section-icon"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path d="M9 6h11" />
                  <path d="M9 12h11" />
                  <path d="M9 18h11" />
                  <path d="M4 6h.01" />
                  <path d="M4 12h.01" />
                  <path d="M4 18h.01" />
                </svg>
              </span>

              <div>
                <h2>
                  {isJapanese
                    ? "求人の基本情報"
                    : "Basic job information"}
                </h2>

                <p>
                  {isJapanese
                    ? "求人タイトルと仕事内容を編集します。"
                    : "Edit the title and job description."}
                </p>
              </div>
            </div>

            <div className="form-row">
              <label
                className={
                  !job.title_en.trim()
                    ? "field-required"
                    : ""
                }
              >
                {t("jobTitleEnglish")}
                <span aria-hidden="true">
                  {" "}*
                </span>

                <input
                  name="title_en"
                  value={job.title_en}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                {t("jobTitleJapanese")}

                <input
                  name="title_ja"
                  value={job.title_ja}
                  onChange={handleChange}
                />
              </label>
            </div>

            <label
              className={
                !job.description_en.trim()
                  ? "field-required"
                  : ""
              }
            >
              {t("descriptionEnglish")}
              <span aria-hidden="true">
                {" "}*
              </span>

              <textarea
                name="description_en"
                value={job.description_en}
                onChange={handleChange}
                rows="7"
                required
              />

              <small>
                {job.description_en.length}
                /2000
              </small>
            </label>

            <label>
              {t("descriptionJapanese")}

              <textarea
                name="description_ja"
                value={job.description_ja}
                onChange={handleChange}
                rows="7"
              />

              <small>
                {job.description_ja.length}
                /2000
              </small>
            </label>
          </section>

          <section className="profile-editor-card">
            <div className="profile-section-heading">
              <span
                className="profile-section-icon"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path d="M12 3l2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7L12 3z" />
                </svg>
              </span>

              <div>
                <h2>
                  {isJapanese
                    ? "応募条件とマッチング"
                    : "Requirements and matching"}
                </h2>

                <p>
                  {isJapanese
                    ? "学生とのマッチングに使用されます。"
                    : "These details are used for student matching."}
                </p>
              </div>
            </div>

            <label
              className={
                !job.requirements.trim()
                  ? "field-required"
                  : ""
              }
            >
              {t("requirements")}

              <textarea
                name="requirements"
                value={job.requirements}
                onChange={handleChange}
                rows="5"
                placeholder={
                  isJapanese
                    ? "例：React, JavaScript, Git"
                    : "Example: React, JavaScript, Git"
                }
              />

              <small>
                {isJapanese
                  ? "重要なスキルはカンマで区切ってください。"
                  : "Separate important skills with commas."}
              </small>
            </label>

            <div className="form-row">
              <label
                className={
                  !job.location.trim()
                    ? "field-required"
                    : ""
                }
              >
                {t("location")}
                <span aria-hidden="true">
                  {" "}*
                </span>

                <input
                  name="location"
                  value={job.location}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                {t("japaneseLevel")}

                <select
                  name="japanese_level"
                  value={job.japanese_level}
                  onChange={handleChange}
                >
                  <option value="not_required">
                    {t("notRequired")}
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
            </div>

            <div className="form-row">
              <label>
                {t("employmentType")}

                <select
                  name="employment_type"
                  value={job.employment_type}
                  onChange={handleChange}
                >
                  <option value="full_time">
                    {t("fullTime")}
                  </option>

                  <option value="part_time">
                    {t("partTime")}
                  </option>

                  <option value="internship">
                    {t("internship")}
                  </option>

                  <option value="contract">
                    {t("contract")}
                  </option>
                </select>
              </label>

              <label>
                {t("workplaceType")}

                <select
                  name="workplace_type"
                  value={job.workplace_type}
                  onChange={handleChange}
                >
                  <option value="onsite">
                    {t("onsite")}
                  </option>

                  <option value="remote">
                    {t("remote")}
                  </option>

                  <option value="hybrid">
                    {t("hybrid")}
                  </option>
                </select>
              </label>
            </div>
          </section>

          <section className="profile-editor-card">
            <div className="profile-section-heading">
              <span
                className="profile-section-icon"
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
                  <path d="M10 8h4" />
                  <path d="M10 16h4" />
                </svg>
              </span>

              <div>
                <h2>
                  {isJapanese
                    ? "給与と応募期限"
                    : "Salary and deadline"}
                </h2>

                <p>
                  {isJapanese
                    ? "給与範囲と応募受付期間を更新します。"
                    : "Update the salary range and application period."}
                </p>
              </div>
            </div>

            <div className="form-row">
              <label>
                {t("minimumSalary")}

                <div className="salary-input">
                  <span>¥</span>

                  <input
                    type="number"
                    name="salary_min"
                    value={job.salary_min}
                    onChange={handleChange}
                    min="0"
                    step="10000"
                  />
                </div>
              </label>

              <label>
                {t("maximumSalary")}

                <div className="salary-input">
                  <span>¥</span>

                  <input
                    type="number"
                    name="salary_max"
                    value={job.salary_max}
                    onChange={handleChange}
                    min="0"
                    step="10000"
                  />
                </div>
              </label>
            </div>

            <label>
              {t("deadline")}

              <input
                type="date"
                name="deadline"
                value={job.deadline}
                onChange={handleChange}
              />
            </label>
          </section>

          <div className="job-editor-actions edit-job-actions">
            <div>
              <strong>
                {isJapanese
                  ? "変更を保存"
                  : "Save your changes"}
              </strong>

              <p>
                {isJapanese
                  ? "求人の公開状態もここから変更できます。"
                  : "You can also change the publishing status here."}
              </p>
            </div>

            <div>
              <button
                className="secondary-button"
                type="button"
                disabled={isSaving}
                onClick={(event) =>
                  saveJob(event, "draft")
                }
              >
                {savingAction === "draft"
                  ? (
                    isJapanese
                      ? "保存中..."
                      : "Saving..."
                  )
                  : (
                    isJapanese
                      ? "下書きとして保存"
                      : "Save as draft"
                  )}
              </button>

              <button
                className="submit-button"
                type="button"
                disabled={isSaving}
                onClick={(event) =>
                  saveJob(
                    event,
                    "published",
                  )
                }
              >
                {savingAction ===
                "published"
                  ? (
                    isJapanese
                      ? "公開中..."
                      : "Publishing..."
                  )
                  : job.effective_status ===
                      "published"
                    ? (
                      isJapanese
                        ? "変更を保存"
                        : "Save changes"
                    )
                    : (
                      isJapanese
                        ? "求人を公開"
                        : "Publish job"
                    )}
              </button>

              {job.effective_status ===
                "published" && (
                <button
                  className="job-close-button"
                  type="button"
                  disabled={isSaving}
                  onClick={(event) =>
                    saveJob(
                      event,
                      "closed",
                    )
                  }
                >
                  {savingAction ===
                  "closed"
                    ? (
                      isJapanese
                        ? "終了中..."
                        : "Closing..."
                    )
                    : (
                      isJapanese
                        ? "募集を終了"
                        : "Close job"
                    )}
                </button>
              )}
            </div>
          </div>
        </form>

        <aside className="job-editor-sidebar">
          <section className="job-preview-card">
            <div className="job-preview-header">
              <p className="eyebrow">
                {isJapanese
                  ? "ライブプレビュー"
                  : "Live preview"}
              </p>

              <span>
                {statusLabels[
                  job.effective_status
                ] || job.effective_status}
              </span>
            </div>

            <div className="job-preview-company">
              {companyProfile?.logo ? (
                <img
                  src={companyProfile.logo}
                  alt=""
                />
              ) : (
                <span aria-hidden="true">
                  {
                    companyProfile
                      ?.company_name
                      ?.charAt(0)
                      ?.toUpperCase() ||
                    "C"
                  }
                </span>
              )}

              <div>
                <strong>
                  {
                    companyProfile
                      ?.company_name ||
                    job.company_name ||
                    (
                      isJapanese
                        ? "企業名"
                        : "Company name"
                    )
                  }
                </strong>

                {companyProfile?.is_verified && (
                  <small>
                    ✓{" "}
                    {isJapanese
                      ? "認証済み企業"
                      : "Verified company"}
                  </small>
                )}
              </div>
            </div>

            <h2>{previewTitle}</h2>

            <div className="job-preview-meta">
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

                {job.location ||
                  (
                    isJapanese
                      ? "勤務地"
                      : "Location"
                  )}
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

                {formatSalary()}
              </span>
            </div>

            <div className="job-preview-tags">
              <span>
                {
                  employmentLabels[
                    job.employment_type
                  ]
                }
              </span>

              <span>
                {
                  japaneseLabels[
                    job.japanese_level
                  ]
                }
              </span>
            </div>

            <p className="job-preview-description">
              {(
                isJapanese &&
                job.description_ja
              )
                ? job.description_ja
                : (
                  job.description_en ||
                  (
                    isJapanese
                      ? "仕事内容がここに表示されます。"
                      : "The job description will appear here."
                  )
                )}
            </p>
          </section>

          <section className="job-publish-checklist">
            <div className="job-checklist-heading">
              <div>
                <p className="eyebrow">
                  {isJapanese
                    ? "求人完成度"
                    : "Job readiness"}
                </p>

                <h2>
                  {completionPercentage}%
                </h2>
              </div>

              <span aria-hidden="true">
                {completedCount}/
                {checklist.length}
              </span>
            </div>

            <div
              className="job-checklist-progress"
              role="progressbar"
              aria-label={
                isJapanese
                  ? "求人情報の完成度"
                  : "Job information completion"
              }
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={
                completionPercentage
              }
            >
              <span
                style={{
                  width:
                    `${completionPercentage}%`,
                }}
              />
            </div>

            <ul>
              {checklist.map((item) => (
                <li
                  className={
                    item.complete
                      ? "complete"
                      : ""
                  }
                  key={item.key}
                >
                  <span aria-hidden="true">
                    {item.complete
                      ? "✓"
                      : "○"}
                  </span>

                  {item.label}
                </li>
              ))}
            </ul>
          </section>

          <section
            className={
              `job-company-status ${
                job.effective_status
              }`
            }
          >
            <span aria-hidden="true">
              {job.effective_status ===
              "published"
                ? "✓"
                : "i"}
            </span>

            <div>
              <strong>
                {statusLabels[
                  job.effective_status
                ]}
              </strong>

              <p>
                {job.accepts_applications
                  ? (
                    isJapanese
                      ? "現在、応募を受け付けています。"
                      : "This job is accepting applications."
                  )
                  : (
                    isJapanese
                      ? "現在、応募を受け付けていません。"
                      : "This job is not accepting applications."
                  )}
              </p>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}

export default EditJob;