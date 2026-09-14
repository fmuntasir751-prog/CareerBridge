import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import api from "../services/api";

const statusOptions = [
  "pending",
  "reviewing",
  "interview",
  "accepted",
  "rejected",
];

function Applications() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isJapanese = i18n.language.startsWith("ja");

  useEffect(() => {
    const loadApplications = async () => {
      try {
        const [userResponse, applicationsResponse] =
          await Promise.all([
            api.get("/auth/me/"),
            api.get("/applications/"),
          ]);

        setUser(userResponse.data);
        setApplications(applicationsResponse.data);
      } catch {
        setError(t("applicationsLoadError"));
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, [t]);

  const updateStatus = async (applicationId, status) => {
    try {
      await api.patch(
        `/applications/${applicationId}/`,
        { status },
      );

      setApplications((currentApplications) =>
        currentApplications.map((application) =>
          application.id === applicationId
            ? { ...application, status }
            : application,
        ),
      );
    } catch {
      setError(t("statusUpdateError"));
    }
  };

  if (loading) {
    return <div className="page-loading">{t("loading")}</div>;
  }

  return (
    <main className="applications-page">
      <header className="dashboard-header">
        <a href="/" className="auth-brand">
          <span>CB</span>
          CareerBridge
        </a>

        <button
          type="button"
          onClick={() => navigate("/dashboard")}
        >
          ← {t("dashboard")}
        </button>
      </header>

      <section className="applications-content">
        <p className="eyebrow">
          {user?.role === "company"
            ? t("recruitment")
            : t("jobSearch")}
        </p>

        <h1>
          {user?.role === "company"
            ? t("manageApplications")
            : t("myApplications")}
        </h1>

        {error && (
          <div className="form-message error">{error}</div>
        )}

        <div className="application-list">
          {applications.map((application) => {
            const jobTitle =
              isJapanese && application.job_title_ja
                ? application.job_title_ja
                : application.job_title;

            return (
              <article
                className="application-card"
                key={application.id}
              >
                <div>
                  <span className="status-badge">
                    {t(application.status)}
                  </span>

                  <h2>{jobTitle}</h2>

                  {user?.role === "student" && (
                    <p>{application.company_name}</p>
                  )}

                  {user?.role === "company" && (
                    <>
                      <p>
                        <strong>{t("applicant")}:</strong>{" "}
                        {application.applicant_name}
                      </p>
                      <p>{application.applicant_email}</p>
                    </>
                  )}

                  <small>
                    {new Date(
                      application.applied_at,
                    ).toLocaleDateString(
                      isJapanese ? "ja-JP" : "en-US",
                    )}
                  </small>
                </div>

                {user?.role === "company" && (
                  <label className="status-control">
                    {t("applicationStatus")}

                    <select
                      value={application.status}
                      onChange={(event) =>
                        updateStatus(
                          application.id,
                          event.target.value,
                        )
                      }
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {t(status)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </article>
            );
          })}
        </div>

        {!applications.length && !error && (
          <p className="empty-message">
            {t("noApplications")}
          </p>
        )}
      </section>
    </main>
  );
}

export default Applications;