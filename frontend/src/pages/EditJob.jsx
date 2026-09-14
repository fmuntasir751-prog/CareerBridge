import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import api from "../services/api";

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
  is_active: true,
};

function EditJob() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [job, setJob] = useState(emptyJob);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadJob = async () => {
      try {
        const response = await api.get(`/jobs/${id}/`);

        setJob({
          title_en: response.data.title_en || "",
          title_ja: response.data.title_ja || "",
          description_en: response.data.description_en || "",
          description_ja: response.data.description_ja || "",
          requirements: response.data.requirements || "",
          location: response.data.location || "",
          employment_type:
            response.data.employment_type || "full_time",
          workplace_type:
            response.data.workplace_type || "onsite",
          japanese_level:
            response.data.japanese_level || "not_required",
          salary_min: response.data.salary_min || "",
          salary_max: response.data.salary_max || "",
          deadline: response.data.deadline || "",
          is_active: response.data.is_active,
        });
      } catch {
        setError(t("jobLoadError"));
      } finally {
        setLoading(false);
      }
    };

    loadJob();
  }, [id, t]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setJob((currentJob) => ({
      ...currentJob,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setSaving(true);

    const payload = {
      ...job,
      salary_min: job.salary_min || null,
      salary_max: job.salary_max || null,
      deadline: job.deadline || null,
    };

    try {
      const response = await api.patch(
        `/jobs/${id}/`,
        payload,
      );

      setJob({
        ...response.data,
        salary_min: response.data.salary_min || "",
        salary_max: response.data.salary_max || "",
        deadline: response.data.deadline || "",
      });

      setMessage(t("jobUpdated"));
    } catch (requestError) {
      const responseData = requestError.response?.data;

      if (responseData) {
        setError(Object.values(responseData).flat().join(" "));
      } else {
        setError(t("jobUpdateError"));
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="page-loading">{t("loading")}</div>;
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

        <h1>{t("editJob")}</h1>
        <p className="auth-subtitle">{t("editJobMessage")}</p>

        {message && (
          <div className="form-message success">{message}</div>
        )}

        {error && (
          <div className="form-message error">{error}</div>
        )}

        <form className="register-form" onSubmit={handleSubmit}>
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
                <option value="full_time">{t("fullTime")}</option>
                <option value="part_time">{t("partTime")}</option>
                <option value="internship">{t("internship")}</option>
                <option value="contract">{t("contract")}</option>
              </select>
            </label>

            <label>
              {t("workplaceType")}
              <select
                name="workplace_type"
                value={job.workplace_type}
                onChange={handleChange}
              >
                <option value="onsite">{t("onsite")}</option>
                <option value="remote">{t("remote")}</option>
                <option value="hybrid">{t("hybrid")}</option>
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
              <option value="not_required">{t("notRequired")}</option>
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

          <label className="checkbox-label">
            <input
              type="checkbox"
              name="is_active"
              checked={job.is_active}
              onChange={handleChange}
            />
            {t("activeJob")}
          </label>

          <button
            className="submit-button"
            type="submit"
            disabled={saving}
          >
            {saving ? t("saving") : t("saveChanges")}
          </button>
        </form>
      </section>
    </main>
  );
}

export default EditJob;