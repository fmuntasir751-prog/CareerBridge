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

const statusLabels = {
  en: {
    pending: "Pending",
    reviewing: "Reviewing",
    interview: "Interview",
    accepted: "Accepted",
    rejected: "Rejected",
    withdrawn: "Withdrawn",
  },
  ja: {
    pending: "応募済み",
    reviewing: "選考中",
    interview: "面接",
    accepted: "採用",
    rejected: "不採用",
    withdrawn: "辞退",
  },
};

function Applications() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [withdrawingId, setWithdrawingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isJapanese = i18n.language.startsWith("ja");
  const language = isJapanese ? "ja" : "en";

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
        setError(
          isJapanese
            ? "応募情報を読み込めませんでした。"
            : "Could not load applications.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, [isJapanese]);

  const updateStatus = async (
    applicationId,
    newStatus,
  ) => {
    setError("");
    setSuccess("");
    setUpdatingId(applicationId);

    try {
      const response = await api.patch(
        `/applications/${applicationId}/`,
        {
          status: newStatus,
        },
      );

      setApplications((currentApplications) =>
        currentApplications.map((application) =>
          application.id === applicationId
            ? {
                ...application,
                status: response.data.status,
              }
            : application,
        ),
      );

      setSuccess(
        isJapanese
          ? "応募ステータスを更新しました。"
          : "Application status was updated.",
      );
    } catch {
      setError(
        isJapanese
          ? "ステータスを更新できませんでした。"
          : "Could not update the application status.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const withdrawApplication = async (applicationId) => {
    const confirmed = window.confirm(
      isJapanese
        ? "この応募を辞退しますか？"
        : "Are you sure you want to withdraw this application?",
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");
    setWithdrawingId(applicationId);

    try {
      const response = await api.post(
        `/applications/${applicationId}/withdraw/`,
      );

      setApplications((currentApplications) =>
        currentApplications.map((application) =>
          application.id === applicationId
            ? response.data
            : application,
        ),
      );

      setSuccess(
        isJapanese
          ? "応募を辞退しました。"
          : "Your application was withdrawn.",
      );
    } catch (requestError) {
      const responseData = requestError.response?.data;
      const message =
        responseData?.detail ||
        responseData?.non_field_errors?.[0];

      setError(
        message ||
          (isJapanese
            ? "応募を辞退できませんでした。"
            : "Could not withdraw the application."),
      );
    } finally {
      setWithdrawingId(null);
    }
  };

  const getJobTitle = (application) => {
    if (
      isJapanese &&
      application.job_title_ja
    ) {
      return application.job_title_ja;
    }

    return application.job_title;
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString(
      isJapanese ? "ja-JP" : "en-US",
    );

  if (loading) {
    return (
      <div className="page-loading">
        {t("loading")}
      </div>
    );
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
          ← {isJapanese ? "ダッシュボード" : "Dashboard"}
        </button>
      </header>

      <section className="applications-content">
        <p className="eyebrow">
          {user?.role === "company"
            ? isJapanese
              ? "採用管理"
              : "Recruitment"
            : isJapanese
              ? "応募履歴"
              : "Application history"}
        </p>

        <h1>
          {user?.role === "company"
            ? isJapanese
              ? "応募者を管理"
              : "Manage applications"
            : isJapanese
              ? "応募履歴"
              : "My applications"}
        </h1>

        {error && (
          <div className="form-message error">
            {error}
          </div>
        )}

        {success && (
          <div className="form-message success">
            {success}
          </div>
        )}

        <div className="application-list">
          {applications.map((application) => (
            <article
              className="application-card"
              key={application.id}
            >
              <div className="application-information">
                <span
                  className={`status-badge status-${application.status}`}
                >
                  {statusLabels[language][
                    application.status
                  ] || application.status}
                </span>

                <h2>{getJobTitle(application)}</h2>

                <p>
                  <strong>
                    {isJapanese ? "会社：" : "Company: "}
                  </strong>
                  {application.company_name}
                </p>

                {user?.role === "company" && (
                  <>
                    <p>
                      <strong>
                        {isJapanese
                          ? "応募者："
                          : "Applicant: "}
                      </strong>
                      {application.applicant_name}
                    </p>

                    <p>
                      <strong>
                        {isJapanese
                          ? "メール："
                          : "Email: "}
                      </strong>
                      {application.applicant_email}
                    </p>
                  </>
                )}

                <p>
                  <strong>
                    {isJapanese
                      ? "応募日："
                      : "Applied: "}
                  </strong>
                  {formatDate(application.applied_at)}
                </p>

                {application.cover_letter && (
                  <div className="application-cover-letter">
                    <h3>
                      {isJapanese
                        ? "カバーレター"
                        : "Cover letter"}
                    </h3>
                    <p>{application.cover_letter}</p>
                  </div>
                )}

                {application.resume && (
                  <a
                    className="resume-link"
                    href={application.resume}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {isJapanese
                      ? "履歴書を見る"
                      : "View resume"}
                  </a>
                )}
              </div>

              <div className="application-actions">
                <a
                  className="secondary-button"
                  href={`/jobs/${application.job}`}
                >
                  {isJapanese
                    ? "求人を見る"
                    : "View job"}
                </a>

                {user?.role === "student" &&
                  ![
                    "accepted",
                    "rejected",
                    "withdrawn",
                  ].includes(application.status) && (
                    <button
                      className="delete-button"
                      type="button"
                      disabled={
                        withdrawingId === application.id
                      }
                      onClick={() =>
                        withdrawApplication(application.id)
                      }
                    >
                      {withdrawingId === application.id
                        ? isJapanese
                          ? "処理中..."
                          : "Withdrawing..."
                        : isJapanese
                          ? "応募を辞退"
                          : "Withdraw application"}
                    </button>
                  )}

                {user?.role === "company" &&
                  application.status !== "withdrawn" && (
                  <label className="status-control">
                    <span>
                      {isJapanese
                        ? "ステータス"
                        : "Status"}
                    </span>

                    <select
                      value={application.status}
                      disabled={
                        updatingId === application.id
                      }
                      onChange={(event) =>
                        updateStatus(
                          application.id,
                          event.target.value,
                        )
                      }
                    >
                      {statusOptions.map((status) => (
                        <option
                          value={status}
                          key={status}
                        >
                          {statusLabels[language][status]}
                        </option>
                      ))}
                    </select>
                  </label>
                  )}
              </div>
            </article>
          ))}
        </div>

        {!applications.length && !error && (
          <div className="empty-message">
            <p>
              {user?.role === "company"
                ? isJapanese
                  ? "応募者はまだいません。"
                  : "There are no applications yet."
                : isJapanese
                  ? "まだ求人に応募していません。"
                  : "You have not applied for any jobs yet."}
            </p>

            {user?.role === "student" && (
              <a
                className="primary-button"
                href="/jobs"
              >
                {isJapanese
                  ? "求人を探す"
                  : "Browse jobs"}
              </a>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default Applications;
