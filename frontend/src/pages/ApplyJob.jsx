import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import api, {
  getApiErrorMessage,
} from "../services/api";

const FileIcon = () => (
  <svg
    aria-hidden="true"
    fill="none"
    viewBox="0 0 24 24"
  >
    <path
      d="M7 3.75h6.5L18.25 8.5V20.25H7V3.75Z"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
    <path
      d="M13.5 3.75V8.5H18.25"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
    <path
      d="M9.75 12H15.5M9.75 15.25H15.5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.8"
    />
  </svg>
);

const CheckIcon = () => (
  <svg
    aria-hidden="true"
    fill="none"
    viewBox="0 0 24 24"
  >
    <path
      d="m6.75 12.25 3.25 3.25 7.25-7.25"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  </svg>
);

function ApplyJob() {
  const { id } = useParams();
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [profile, setProfile] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const isJapanese = i18n.language.startsWith("ja");

  useEffect(() => {
    const loadApplicationData = async () => {
      try {
        const [jobResponse, profileResponse] =
          await Promise.all([
            api.get(`/jobs/${id}/`),
            api.get("/profiles/student/me/"),
          ]);

        setJob(jobResponse.data);
        setProfile(profileResponse.data);
      } catch (requestError) {
        if (requestError.response?.status === 401) {
          navigate("/login");
          return;
        }

        setError(
          getApiErrorMessage(
            requestError,
            isJapanese
              ? "応募情報を読み込めませんでした。"
              : "Could not load the application information.",
          ),
        );
      } finally {
        setPageLoading(false);
      }
    };

    loadApplicationData();
  }, [id, isJapanese, navigate]);

  const characterCount = coverLetter.length;

  const wordCount = useMemo(() => {
    const normalizedText = coverLetter.trim();

    if (!normalizedText) {
      return 0;
    }

    return normalizedText.split(/\s+/).length;
  }, [coverLetter]);

  const selectedResumeName =
    resumeFile?.name ||
    (
      profile?.resume
        ? decodeURIComponent(
            profile.resume.split("/").pop(),
          )
        : ""
    );

  const title =
    isJapanese && job?.title_ja
      ? job.title_ja
      : job?.title_en;

  const handleResumeChange = (event) => {
    const file = event.target.files?.[0];

    setError("");

    if (!file) {
      setResumeFile(null);
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      (
        "application/vnd.openxmlformats-officedocument." +
        "wordprocessingml.document"
      ),
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        isJapanese
          ? "PDF、DOC、DOCX形式の履歴書を選択してください。"
          : "Please select a PDF, DOC or DOCX resume.",
      );

      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        isJapanese
          ? "履歴書のファイルサイズは5MB以下にしてください。"
          : "The resume file must be 5 MB or smaller.",
      );

      event.target.value = "";
      return;
    }

    setResumeFile(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!localStorage.getItem("careerbridge-access")) {
      navigate("/login");
      return;
    }

    if (coverLetter.trim().length < 50) {
      setError(
        isJapanese
          ? "カバーレターを50文字以上入力してください。"
          : "Please write at least 50 characters in your cover letter.",
      );
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();

      formData.append("job", Number(id));
      formData.append(
        "cover_letter",
        coverLetter.trim(),
      );

      if (resumeFile) {
        formData.append("resume", resumeFile);
      }

      await api.post(
        "/applications/",
        formData,
      );

      setSubmitted(true);
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        navigate("/login");
        return;
      }

      setError(
        getApiErrorMessage(
          requestError,
          isJapanese
            ? "応募を送信できませんでした。"
            : "Could not submit your application.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="page-loading">
        {isJapanese
          ? "応募情報を読み込んでいます..."
          : "Loading application information..."}
      </div>
    );
  }

  if (submitted) {
    return (
      <main className="professional-apply-page">
        <section className="application-success-card">
          <div className="application-success-icon">
            <CheckIcon />
          </div>

          <p className="eyebrow">
            {isJapanese
              ? "応募完了"
              : "Application submitted"}
          </p>

          <h1>
            {isJapanese
              ? "応募を送信しました"
              : "Your application is on its way"}
          </h1>

          <p>
            {isJapanese
              ? `「${title}」への応募が正常に送信されました。応募状況は応募履歴から確認できます。`
              : `Your application for “${title}” was submitted successfully. You can follow its status from your applications page.`}
          </p>

          <div className="application-success-actions">
            <button
              className="primary-button"
              type="button"
              onClick={() => navigate("/applications")}
            >
              {isJapanese
                ? "応募状況を見る"
                : "View applications"}
            </button>

            <button
              className="secondary-button"
              type="button"
              onClick={() => navigate("/jobs")}
            >
              {isJapanese
                ? "他の求人を探す"
                : "Browse more jobs"}
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="professional-apply-page">
      <header className="dashboard-header">
        <a href="/" className="auth-brand">
          <span>CB</span>
          CareerBridge
        </a>

        <button
          type="button"
          onClick={() => navigate(`/jobs/${id}`)}
        >
          ← {isJapanese ? "求人詳細" : "Job details"}
        </button>
      </header>

      <section className="professional-apply-content">
        <div className="apply-page-heading">
          <p className="eyebrow">
            {isJapanese
              ? "応募フォーム"
              : "Job application"}
          </p>

          <h1>
            {isJapanese
              ? "応募内容を確認"
              : "Complete your application"}
          </h1>

          <p>
            {isJapanese
              ? "送信前に、応募内容と履歴書を確認してください。"
              : "Review your application details before submitting."}
          </p>
        </div>

        {error && (
          <div
            className="form-message error"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="professional-apply-layout">
          <form
            className="apply-form-panel"
            onSubmit={handleSubmit}
          >
            <section className="apply-form-section">
              <div className="apply-section-heading">
                <span>01</span>

                <div>
                  <h2>
                    {isJapanese
                      ? "カバーレター"
                      : "Cover letter"}
                  </h2>

                  <p>
                    {isJapanese
                      ? "この求人に興味を持った理由と、自分の経験を説明してください。"
                      : "Explain why you are interested and how your experience fits the role."}
                  </p>
                </div>
              </div>

              <label className="apply-textarea-label">
                <span>
                  {isJapanese
                    ? "応募メッセージ"
                    : "Application message"}
                </span>

                <textarea
                  value={coverLetter}
                  onChange={(event) =>
                    setCoverLetter(event.target.value)
                  }
                  rows="12"
                  minLength="50"
                  maxLength="3000"
                  required
                  placeholder={
                    isJapanese
                      ? "採用担当者様\n\nこの求人に興味を持った理由、関連するスキルや経験についてご記入ください。"
                      : "Dear hiring team,\n\nExplain why this opportunity interests you and describe your relevant skills and experience."
                  }
                />
              </label>

              <div className="cover-letter-meta">
                <span>
                  {isJapanese
                    ? `${wordCount}語`
                    : `${wordCount} words`}
                </span>

                <span
                  className={
                    characterCount < 50
                      ? "needs-content"
                      : "ready"
                  }
                >
                  {characterCount} / 3000
                </span>
              </div>

              <div className="cover-letter-guidance">
                <strong>
                  {isJapanese
                    ? "効果的なカバーレター"
                    : "A strong cover letter"}
                </strong>

                <ul>
                  <li>
                    {isJapanese
                      ? "応募する職種への関心を説明する"
                      : "Explain your interest in the role"}
                  </li>

                  <li>
                    {isJapanese
                      ? "関連するスキルや経験を紹介する"
                      : "Highlight relevant skills and experience"}
                  </li>

                  <li>
                    {isJapanese
                      ? "簡潔で読みやすい文章にする"
                      : "Keep your message clear and concise"}
                  </li>
                </ul>
              </div>
            </section>

            <section className="apply-form-section">
              <div className="apply-section-heading">
                <span>02</span>

                <div>
                  <h2>
                    {isJapanese
                      ? "履歴書"
                      : "Resume"}
                  </h2>

                  <p>
                    {isJapanese
                      ? "プロフィールの履歴書を使用するか、応募用のファイルをアップロードできます。"
                      : "Use your profile resume or upload a version for this application."}
                  </p>
                </div>
              </div>

              <label className="application-resume-upload">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeChange}
                />

                <span className="application-resume-icon">
                  <FileIcon />
                </span>

                <span className="application-resume-information">
                  <strong>
                    {resumeFile
                      ? isJapanese
                        ? "新しい履歴書を選択しました"
                        : "New resume selected"
                      : selectedResumeName
                        ? isJapanese
                          ? "プロフィールの履歴書"
                          : "Profile resume"
                        : isJapanese
                          ? "履歴書をアップロード"
                          : "Upload your resume"}
                  </strong>

                  <small>
                    {selectedResumeName ||
                      (
                        isJapanese
                          ? "PDF、DOC、DOCX・最大5MB"
                          : "PDF, DOC or DOCX · Maximum 5 MB"
                      )}
                  </small>
                </span>

                <span className="application-resume-action">
                  {isJapanese ? "選択" : "Choose"}
                </span>
              </label>
            </section>

            <div className="application-consent">
              <CheckIcon />

              <p>
                {isJapanese
                  ? "送信することで、入力した情報がこの求人を掲載した企業に共有されることに同意します。"
                  : "By submitting, you agree that your application information will be shared with the company that posted this job."}
              </p>
            </div>

            <button
              className="submit-button application-submit-button"
              type="submit"
              disabled={
                submitting ||
                coverLetter.trim().length < 50
              }
            >
              {submitting
                ? isJapanese
                  ? "送信中..."
                  : "Submitting..."
                : isJapanese
                  ? "応募を送信"
                  : "Submit application"}
            </button>
          </form>

          <aside className="application-summary-panel">
            <p className="eyebrow">
              {isJapanese
                ? "応募する求人"
                : "Applying for"}
            </p>

            <h2>{title}</h2>

            <p className="application-summary-company">
              {job?.company_name}
            </p>

            <dl className="application-summary-details">
              <div>
                <dt>
                  {isJapanese ? "勤務地" : "Location"}
                </dt>
                <dd>{job?.location}</dd>
              </div>

              <div>
                <dt>
                  {isJapanese
                    ? "勤務形態"
                    : "Workplace"}
                </dt>
                <dd>{job?.workplace_type}</dd>
              </div>

              <div>
                <dt>
                  {isJapanese
                    ? "雇用形態"
                    : "Employment"}
                </dt>
                <dd>{job?.employment_type}</dd>
              </div>

              <div>
                <dt>
                  {isJapanese
                    ? "応募締切"
                    : "Deadline"}
                </dt>
                <dd>
                  {job?.deadline
                    ? new Date(
                        `${job.deadline}T00:00:00`,
                      ).toLocaleDateString(
                        isJapanese
                          ? "ja-JP"
                          : "en-US",
                      )
                    : isJapanese
                      ? "指定なし"
                      : "Not specified"}
                </dd>
              </div>
            </dl>

            <div className="application-review-checklist">
              <h3>
                {isJapanese
                  ? "送信前の確認"
                  : "Before submitting"}
              </h3>

              <div>
                <CheckIcon />
                <span>
                  {isJapanese
                    ? "プロフィール情報を確認"
                    : "Profile information reviewed"}
                </span>
              </div>

              <div>
                <CheckIcon />
                <span>
                  {coverLetter.trim().length >= 50
                    ? isJapanese
                      ? "カバーレターの準備完了"
                      : "Cover letter is ready"
                    : isJapanese
                      ? "カバーレターを50文字以上入力"
                      : "Write at least 50 characters"}
                </span>
              </div>

              <div>
                <CheckIcon />
                <span>
                  {selectedResumeName
                    ? isJapanese
                      ? "履歴書を確認"
                      : "Resume reviewed"
                    : isJapanese
                      ? "必要に応じて履歴書を追加"
                      : "Add a resume if needed"}
                </span>
              </div>
            </div>

            <button
              className="application-summary-back"
              type="button"
              onClick={() => navigate(`/jobs/${id}`)}
            >
              ←{" "}
              {isJapanese
                ? "求人詳細に戻る"
                : "Return to job details"}
            </button>
          </aside>
        </div>
      </section>
    </main>
  );
}

export default ApplyJob;