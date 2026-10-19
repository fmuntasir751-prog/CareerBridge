import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import api, {
  getApiErrorMessage,
} from "../services/api";

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

  const isJapanese = i18n.language.startsWith("ja");

  const [job, setJob] = useState(initialJob);
  const [companyProfile, setCompanyProfile] =
    useState(null);

  const [
    checkingVerification,
    setCheckingVerification,
  ] = useState(true);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loadingAction, setLoadingAction] =
    useState("");

  useEffect(() => {
    const checkCompanyVerification = async () => {
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
              : (
                "Company information could "
                + "not be loaded."
              ),
          ),
        );
      } finally {
        setCheckingVerification(false);
      }
    };

    checkCompanyVerification();
  }, [isJapanese]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setJob((currentJob) => ({
      ...currentJob,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const requestedStatus = (
      event.nativeEvent.submitter?.value
      || "draft"
    );

    setMessage("");
    setError("");

    if (
      requestedStatus === "published"
      && !companyProfile?.is_verified
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
      job.salary_min
      && job.salary_max
      && Number(job.salary_min)
        > Number(job.salary_max)
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
      requestedStatus === "published"
      && job.deadline
      && job.deadline < getTodayValue()
    ) {
      setError(
        isJapanese
          ? (
            "公開する求人には、今日以降の"
            + "応募期限を設定してください。"
          )
          : (
            "A published job must have an "
            + "application deadline of today "
            + "or later."
          ),
      );

      return;
    }

    setLoadingAction(requestedStatus);

    const payload = {
      ...job,
      status: requestedStatus,
      is_active: requestedStatus === "published",
      salary_min: job.salary_min || null,
      salary_max: job.salary_max || null,
      deadline: job.deadline || null,
    };

    try {
      const response = await api.post(
        "/jobs/",
        payload,
      );

      const createdStatus = (
        response.data.effective_status
        || response.data.status
      );

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

  const isRejected = (
    companyProfile?.verification_status
    === "rejected"
  );

  const isSaving = Boolean(loadingAction);

  return (
    <main className="auth-page">
      <section
        className="auth-card profile-form-card"
      >
        <button
          className="back-button"
          type="button"
          onClick={() => navigate("/dashboard")}
        >
          ← {t("dashboard")}
        </button>

        <div className="company-profile-heading">
          <div>
            <h1>{t("postJob")}</h1>

            <p className="auth-subtitle">
              {isJapanese
                ? (
                  "求人を下書きとして保存するか、"
                  + "学生向けに公開できます。"
                )
                : (
                  "Save the job as a draft or "
                  + "publish it for students."
                )}
            </p>
          </div>

          {isVerified && (
            <span
              className="verification-badge verified"
            >
              ✓{" "}
              {isJapanese
                ? "認証済み企業"
                : "Verified company"}
            </span>
          )}
        </div>

        {!isVerified && companyProfile && (
          <section
            className={
              `verification-panel ${
                isRejected
                  ? "rejected"
                  : "pending"
              }`
            }
          >
            <div
              className="verification-panel-icon"
              aria-hidden="true"
            >
              {isRejected ? "!" : "…"}
            </div>

            <div>
              <h2>
                {isRejected
                  ? (
                    isJapanese
                      ? "企業認証が却下されました"
                      : "Company verification rejected"
                  )
                  : (
                    isJapanese
                      ? "企業認証を確認中です"
                      : "Company verification pending"
                  )}
              </h2>

              <p>
                {isJapanese
                  ? (
                    "現在は下書きの保存ができます。"
                    + "求人を公開するには企業認証が"
                    + "必要です。"
                  )
                  : (
                    "You can save drafts now. "
                    + "Company verification is "
                    + "required to publish jobs."
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
            </div>
          </section>
        )}

        {message && (
          <div className="form-message success">
            {message}
          </div>
        )}

        {error && (
          <div className="form-message error">
            {error}
          </div>
        )}

        <form
          className="register-form"
          onSubmit={handleSubmit}
        >
          <label>
            {t("jobTitleEnglish")}

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

          <label>
            {t("descriptionEnglish")}

            <textarea
              name="description_en"
              value={job.description_en}
              onChange={handleChange}
              rows="5"
              required
            />
          </label>

          <label>
            {t("descriptionJapanese")}

            <textarea
              name="description_ja"
              value={job.description_ja}
              onChange={handleChange}
              rows="5"
            />
          </label>

          <label>
            {t("requirements")}

            <textarea
              name="requirements"
              value={job.requirements}
              onChange={handleChange}
              rows="4"
            />
          </label>

          <label>
            {t("location")}

            <input
              name="location"
              value={job.location}
              onChange={handleChange}
              required
            />
          </label>

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

          <div className="form-row">
            <label>
              {t("minimumSalary")}

              <input
                type="number"
                name="salary_min"
                value={job.salary_min}
                onChange={handleChange}
                min="0"
                step="10000"
              />
            </label>

            <label>
              {t("maximumSalary")}

              <input
                type="number"
                name="salary_max"
                value={job.salary_max}
                onChange={handleChange}
                min="0"
                step="10000"
              />
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

          <div className="job-lifecycle-actions">
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
                    : "Save as Draft"
                )}
            </button>

            <button
              className="submit-button"
              type="submit"
              name="jobAction"
              value="published"
              disabled={
                isSaving
                || !isVerified
              }
              title={
                isVerified
                  ? ""
                  : (
                    isJapanese
                      ? "企業認証が必要です"
                      : (
                        "Company verification "
                        + "is required"
                      )
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
                    : "Publish Job"
                )}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default CreateJob;