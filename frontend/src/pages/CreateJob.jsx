import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import api, {
  getApiErrorMessage,
} from "../services/api";
import DashboardHeader from "../components/DashboardHeader";
const initialJob = {
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
  is_active: false,
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

function CreateJob() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const isJapanese =
    i18n.language.startsWith("ja");

  const [job, setJob] =
    useState(initialJob);

  const [
    companyProfile,
    setCompanyProfile,
  ] = useState(null);

  const [
    checkingVerification,
    setCheckingVerification,
  ] = useState(true);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [
    loadingAction,
    setLoadingAction,
  ] = useState("");

  useEffect(() => {
    const loadCompanyProfile = async () => {
      try {
        const response = await api.get(
          "/profiles/company/me/",
        );

        setCompanyProfile(response.data);
      } catch (requestError) {
        setError(
          getApiErrorMessage(
            requestError,
            isJapanese
              ? "企業情報を確認できませんでした。"
              : "Company information could not be loaded.",
          ),
        );
      } finally {
        setCheckingVerification(false);
      }
    };

    loadCompanyProfile();
  }, [isJapanese]);

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

  const handleSubmit = async (event) => {
    event.preventDefault();

    const requestedStatus =
      event.nativeEvent.submitter?.value ||
      "draft";

    setMessage("");
    setError("");

    if (
      requestedStatus === "published" &&
      !companyProfile?.is_verified
    ) {
      setError(
        isJapanese
          ? (
            "求人を公開する前に、"
            + "企業認証を完了してください。"
          )
          : (
            "Your company must be verified "
            + "before publishing jobs."
          ),
      );

      return;
    }

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
            "応募期限は今日以降に"
            + "設定してください。"
          )
          : (
            "The application deadline must "
            + "be today or later."
          ),
      );

      return;
    }

    setLoadingAction(requestedStatus);

    const payload = {
      ...job,
      status: requestedStatus,
      is_active:
        requestedStatus === "published",
      salary_min:
        job.salary_min || null,
      salary_max:
        job.salary_max || null,
      deadline:
        job.deadline || null,
    };

    try {
      const response = await api.post(
        "/jobs/",
        payload,
      );

      const createdStatus =
        response.data.effective_status ||
        response.data.status;

      setMessage(
        createdStatus === "published"
          ? (
            isJapanese
              ? "求人を公開しました。"
              : "Job published successfully."
          )
          : (
            isJapanese
              ? "求人を下書きとして保存しました。"
              : "Job saved as a draft."
          ),
      );

      setJob(initialJob);

      window.setTimeout(() => {
        navigate("/my-jobs");
      }, 900);
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          requestedStatus === "published"
            ? (
              isJapanese
                ? "求人を公開できませんでした。"
                : "Could not publish the job."
            )
            : (
              isJapanese
                ? "下書きを保存できませんでした。"
                : "Could not save the draft."
            ),
        ),
      );
    } finally {
      setLoadingAction("");
    }
  };

  if (checkingVerification) {
    return (
      <div className="page-loading">
        {t("loading")}
      </div>
    );
  }

  const isVerified = Boolean(
    companyProfile?.is_verified,
  );

  const isRejected =
    companyProfile?.verification_status ===
    "rejected";

  const isSaving =
    Boolean(loadingAction);

  const previewTitle =
    isJapanese && job.title_ja
      ? job.title_ja
      : job.title_en ||
        (
          isJapanese
            ? "求人タイトル"
            : "Job title"
        );

  return (
    <main className="job-editor-page">
      <DashboardHeader role="company" />
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
              ? "採用管理"
              : "Recruitment"}
          </p>

          <h1>
            {isJapanese
              ? "新しい求人を作成"
              : "Create a new job"}
          </h1>

          <p>
            {isJapanese
              ? (
                "求人情報を入力し、下書きとして"
                + "保存するか学生向けに公開します。"
              )
              : (
                "Add the job details, save a draft "
                + "or publish it for students."
              )}
          </p>
        </div>
      </header>

      {message && (
        <div
          className="form-message success job-editor-message"
          role="status"
        >
          {message}
        </div>
      )}

      {error && (
        <div
          className="form-message error job-editor-message"
          role="alert"
        >
          {error}
        </div>
      )}

      {!isVerified && companyProfile && (
        <section
          className={
            `job-verification-notice ${
              isRejected
                ? "rejected"
                : "pending"
            }`
          }
        >
          <span
            className="job-verification-icon"
            aria-hidden="true"
          >
            {isRejected ? "!" : "…"}
          </span>

          <div>
            <h2>
              {isRejected
                ? (
                  isJapanese
                    ? "企業認証情報を修正してください"
                    : "Company verification needs attention"
                )
                : (
                  isJapanese
                    ? "企業認証を確認中です"
                    : "Company verification is pending"
                )}
            </h2>

            <p>
              {isJapanese
                ? (
                  "求人を下書きとして保存できますが、"
                  + "公開には企業認証が必要です。"
                )
                : (
                  "You can save job drafts, but "
                  + "company verification is required "
                  + "before publishing."
                )}
            </p>

            {companyProfile.verification_note && (
              <p className="verification-note">
                <strong>
                  {isJapanese
                    ? "管理者からのメモ："
                    : "Administrator note:"}
                </strong>{" "}
                {
                  companyProfile
                    .verification_note
                }
              </p>
            )}
          </div>

          <button
            className="secondary-button"
            type="button"
            onClick={() =>
              navigate("/company-profile")
            }
          >
            {isJapanese
              ? "企業プロフィールを確認"
              : "Review company profile"}
          </button>
        </section>
      )}

      <div className="job-editor-layout">
        <form
          className="job-editor-form"
          onSubmit={handleSubmit}
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
                    ? "求人タイトルと仕事内容を入力します。"
                    : "Add the title and job description."}
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
                  placeholder="Frontend Developer"
                  required
                />
              </label>

              <label>
                {t("jobTitleJapanese")}

                <input
                  name="title_ja"
                  value={job.title_ja}
                  onChange={handleChange}
                  placeholder="フロントエンドエンジニア"
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
                placeholder={
                  isJapanese
                    ? "英語で仕事内容を入力してください。"
                    : "Describe the role, responsibilities and team."
                }
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
                placeholder={
                  isJapanese
                    ? "仕事内容、責任、チームについて説明してください。"
                    : "Add the Japanese job description."
                }
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
                    ? "例：React, JavaScript, Git, HTML, CSS"
                    : "Example: React, JavaScript, Git, HTML, CSS"
                }
              />

              <small>
                {isJapanese
                  ? "スキルはカンマで区切って入力してください。"
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
                  placeholder="Osaka, Japan"
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
                  <path d="M8 8h8" />
                  <path d="M8 12h8" />
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
                    ? "給与範囲と応募受付期間を設定します。"
                    : "Set the salary range and application period."}
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
                    placeholder="250000"
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
                    placeholder="350000"
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
                min={getTodayValue()}
              />
            </label>
          </section>

          <div className="job-editor-actions">
            <div>
              <strong>
                {isJapanese
                  ? "公開方法を選択"
                  : "Choose how to continue"}
              </strong>

              <p>
                {isJapanese
                  ? (
                    "後で編集する場合は"
                    + "下書きとして保存してください。"
                  )
                  : (
                    "Save a draft if you want "
                    + "to finish the job later."
                  )}
              </p>
            </div>

            <div>
              <button
                className="secondary-button"
                type="submit"
                name="jobAction"
                value="draft"
                disabled={isSaving}
              >
                {loadingAction === "draft"
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
                type="submit"
                name="jobAction"
                value="published"
                disabled={
                  isSaving ||
                  !isVerified
                }
                title={
                  isVerified
                    ? ""
                    : (
                      isJapanese
                        ? "企業認証が必要です"
                        : "Company verification is required"
                    )
                }
              >
                {loadingAction === "published"
                  ? (
                    isJapanese
                      ? "公開中..."
                      : "Publishing..."
                  )
                  : (
                    isJapanese
                      ? "求人を公開"
                      : "Publish job"
                  )}
              </button>
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
                {isJapanese
                  ? "下書き"
                  : "Draft"}
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
                    (
                      isJapanese
                        ? "企業名"
                        : "Company name"
                    )
                  }
                </strong>

                {isVerified && (
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
                      ? "仕事内容のプレビューがここに表示されます。"
                      : "Your job description preview will appear here."
                  )
                )}
            </p>
          </section>

          <section className="job-publish-checklist">
            <div className="job-checklist-heading">
              <div>
                <p className="eyebrow">
                  {isJapanese
                    ? "公開準備"
                    : "Publishing readiness"}
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
                isVerified
                  ? "verified"
                  : "pending"
              }`
            }
          >
            <span aria-hidden="true">
              {isVerified ? "✓" : "!"}
            </span>

            <div>
              <strong>
                {isVerified
                  ? (
                    isJapanese
                      ? "公開可能"
                      : "Ready to publish"
                  )
                  : (
                    isJapanese
                      ? "下書きのみ"
                      : "Draft only"
                  )}
              </strong>

              <p>
                {isVerified
                  ? (
                    isJapanese
                      ? "企業認証が完了しています。"
                      : "Your company is verified."
                  )
                  : (
                    isJapanese
                      ? "求人公開には企業認証が必要です。"
                      : "Verification is required to publish."
                  )}
              </p>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}

export default CreateJob;