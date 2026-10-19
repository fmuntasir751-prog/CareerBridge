import { useEffect, useState } from "react";
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

function normalizeJob(data) {
  return {
    ...emptyJob,
    ...data,
    salary_min: data.salary_min ?? "",
    salary_max: data.salary_max ?? "",
    deadline: data.deadline ?? "",
    status: data.status || "draft",
    effective_status:
      data.effective_status
      || data.status
      || "draft",
  };
}

function EditJob() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [job, setJob] = useState(emptyJob);
  const [loading, setLoading] = useState(true);
  const [savingAction, setSavingAction] =
    useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isJapanese = i18n.language.startsWith("ja");

  const statusLabels = {
    draft: isJapanese ? "下書き" : "Draft",
    published: isJapanese ? "公開中" : "Published",
    closed: isJapanese ? "終了" : "Closed",
    expired: isJapanese
      ? "募集期限終了"
      : "Expired",
  };

  useEffect(() => {
    const loadJob = async () => {
      try {
        const response = await api.get(
          `/jobs/${id}/`,
        );

        setJob(normalizeJob(response.data));
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

    loadJob();
  }, [id, t]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setJob((currentJob) => ({
      ...currentJob,
      [name]: value,
    }));
  };

  const saveJob = async (
    event,
    requestedStatus = job.status,
  ) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (
      job.salary_min
      && job.salary_max
      && Number(job.salary_min)
        > Number(job.salary_max)
    ) {
      setError(
        isJapanese
          ? "最低給与は最高給与以下にしてください。"
          : "Minimum salary cannot exceed maximum salary.",
      );
      return;
    }

    setSavingAction(requestedStatus);

    const payload = {
      title_en: job.title_en,
      title_ja: job.title_ja,
      description_en: job.description_en,
      description_ja: job.description_ja,
      requirements: job.requirements,
      location: job.location,
      employment_type: job.employment_type,
      workplace_type: job.workplace_type,
      japanese_level: job.japanese_level,
      salary_min: job.salary_min || null,
      salary_max: job.salary_max || null,
      deadline: job.deadline || null,
      status: requestedStatus,
    };

    try {
      const response = await api.patch(
        `/jobs/${id}/`,
        payload,
      );

      setJob(normalizeJob(response.data));

      if (requestedStatus === "draft") {
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
            : "The job was published.",
        );
      } else if (
        requestedStatus === "closed"
      ) {
        setMessage(
          isJapanese
            ? "求人募集を終了しました。"
            : "The job was closed.",
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

  return (
    <main className="auth-page">
      <section className="auth-card profile-form-card">
        <button
          className="back-button"
          type="button"
          onClick={() => navigate("/my-jobs")}
        >
          ← {t("myPostedJobs")}
        </button>

        <div className="job-editor-heading">
          <div>
            <h1>{t("editJob")}</h1>
            <p className="auth-subtitle">
              {t("editJobMessage")}
            </p>
          </div>

          <span
            className={`job-lifecycle-badge ${
              job.effective_status
            }`}
          >
            {statusLabels[
              job.effective_status
            ] || job.effective_status}
          </span>
        </div>

        {job.effective_status === "expired" && (
          <div className="form-message warning">
            {isJapanese
              ? "募集期限が終了しています。再公開するには新しい締切日を設定してください。"
              : "This job has expired. Set a new deadline before publishing it again."}
          </div>
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
          onSubmit={(event) =>
            saveJob(event, job.status)
          }
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
              <option value="n3">JLPT N3</option>
              <option value="n2">JLPT N2</option>
              <option value="n1">JLPT N1</option>
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
            />
          </label>

          <div className="job-lifecycle-actions">
            <button
              className="secondary-button"
              type="button"
              disabled={Boolean(savingAction)}
              onClick={(event) =>
                saveJob(event, "draft")
              }
            >
              {savingAction === "draft"
                ? t("saving")
                : isJapanese
                  ? "下書きとして保存"
                  : "Save as draft"}
            </button>

            <button
              className="submit-button"
              type="button"
              disabled={Boolean(savingAction)}
              onClick={(event) =>
                saveJob(event, "published")
              }
            >
              {savingAction === "published"
                ? isJapanese
                  ? "公開しています..."
                  : "Publishing..."
                : isJapanese
                  ? "求人を公開"
                  : "Publish job"}
            </button>

            {job.effective_status
              === "published" && (
              <button
                className="job-close-button"
                type="button"
                disabled={Boolean(savingAction)}
                onClick={(event) =>
                  saveJob(event, "closed")
                }
              >
                {savingAction === "closed"
                  ? isJapanese
                    ? "終了しています..."
                    : "Closing..."
                  : isJapanese
                    ? "募集を終了"
                    : "Close job"}
              </button>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}

export default EditJob;