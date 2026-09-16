import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import api from "../services/api";

const fieldLabels = {
  en: {
    headline: "Professional headline",
    bio: "About you",
    skills: "Skills",
    university: "School or university",
    graduation_year: "Graduation year",
    location: "Location",
    profile_image: "Profile image",
    resume: "Resume",
  },
  ja: {
    headline: "プロフィール見出し",
    bio: "自己紹介",
    skills: "スキル",
    university: "学校・大学",
    graduation_year: "卒業予定年",
    location: "希望勤務地",
    profile_image: "プロフィール画像",
    resume: "履歴書",
  },
};

const nextActionContent = {
  complete_profile: {
    en: {
      title: "Complete your profile",
      message:
        "A complete profile helps companies understand your skills and experience.",
      button: "Edit profile",
      path: "/profile",
    },
    ja: {
      title: "プロフィールを完成させましょう",
      message:
        "プロフィールを完成させると、企業にスキルや経験が伝わりやすくなります。",
      button: "プロフィール編集",
      path: "/profile",
    },
  },
  apply_for_jobs: {
    en: {
      title: "Start applying for jobs",
      message:
        "Your profile is ready. Browse available jobs and submit your first application.",
      button: "Browse jobs",
      path: "/jobs",
    },
    ja: {
      title: "求人に応募しましょう",
      message:
        "プロフィールの準備ができました。求人を探して最初の応募をしましょう。",
      button: "求人を探す",
      path: "/jobs",
    },
  },
  prepare_for_interview: {
    en: {
      title: "Prepare for your interview",
      message:
        "You have an interview opportunity. Use the AI career assistant to practise.",
      button: "Open dashboard",
      path: "/dashboard",
    },
    ja: {
      title: "面接の準備をしましょう",
      message:
        "面接の機会があります。AIキャリアアシスタントで練習しましょう。",
      button: "ダッシュボード",
      path: "/dashboard",
    },
  },
  continue_job_search: {
    en: {
      title: "Continue your job search",
      message:
        "Keep exploring suitable opportunities and save interesting jobs.",
      button: "Browse jobs",
      path: "/jobs",
    },
    ja: {
      title: "就職活動を続けましょう",
      message:
        "自分に合う求人を探し、気になる求人を保存しましょう。",
      button: "求人を探す",
      path: "/jobs",
    },
  },
};

function StudentProgress() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isJapanese = i18n.language.startsWith("ja");
  const language = isJapanese ? "ja" : "en";

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const response = await api.get(
          "/profiles/student/progress/",
        );

        setProgress(response.data);
      } catch {
        setError(
          isJapanese
            ? "キャリア進捗を読み込めませんでした。"
            : "Could not load your career progress.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [isJapanese]);

  if (loading) {
    return (
      <div className="page-loading">
        {isJapanese ? "読み込み中..." : "Loading..."}
      </div>
    );
  }

  if (error || !progress) {
    return (
      <div className="page-loading">
        <div>
          <p>{error}</p>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
          >
            {isJapanese
              ? "ダッシュボードに戻る"
              : "Back to dashboard"}
          </button>
        </div>
      </div>
    );
  }

  const applicationCards = [
    {
      label: isJapanese ? "応募数" : "Applications",
      value: progress.applications.total,
      icon: "📨",
    },
    {
      label: isJapanese ? "選考中" : "Reviewing",
      value: progress.applications.reviewing,
      icon: "🔍",
    },
    {
      label: isJapanese ? "面接" : "Interviews",
      value: progress.applications.interview,
      icon: "💬",
    },
    {
      label: isJapanese ? "採用" : "Accepted",
      value: progress.applications.accepted,
      icon: "🎉",
    },
    {
      label: isJapanese ? "保存した求人" : "Saved jobs",
      value: progress.saved_jobs,
      icon: "🔖",
    },
  ];

  const nextAction =
    nextActionContent[progress.next_action]?.[language] ||
    nextActionContent.continue_job_search[language];

  return (
    <main className="student-progress-page">
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

      <section className="student-progress-content">
        <p className="eyebrow">
          {isJapanese
            ? "キャリア活動"
            : "Career activity"}
        </p>

        <div className="student-progress-title">
          <div>
            <h1>
              {isJapanese
                ? "キャリア進捗"
                : "Career progress"}
            </h1>

            <p>
              {isJapanese
                ? "プロフィールと就職活動の進捗を確認できます。"
                : "Track your profile and job-search progress."}
            </p>
          </div>

          <button
            className="primary-button"
            type="button"
            onClick={() => navigate("/jobs")}
          >
            {isJapanese ? "求人を探す" : "Browse jobs"}
          </button>
        </div>

        <div className="student-progress-top-grid">
          <section className="progress-panel profile-progress-panel">
            <div
              className="profile-completion-circle"
              style={{
                "--completion": `${progress.profile_completion}%`,
              }}
            >
              <div>
                <strong>
                  {progress.profile_completion}%
                </strong>

                <span>
                  {isJapanese ? "完了" : "complete"}
                </span>
              </div>
            </div>

            <div>
              <h2>
                {isJapanese
                  ? "プロフィール完成度"
                  : "Profile completion"}
              </h2>

              <p>
                {progress.completed_fields} /{" "}
                {progress.total_fields}{" "}
                {isJapanese
                  ? "項目が入力済みです。"
                  : "profile fields completed."}
              </p>

              <button
                className="secondary-button"
                type="button"
                onClick={() => navigate("/profile")}
              >
                {isJapanese
                  ? "プロフィール編集"
                  : "Edit profile"}
              </button>
            </div>
          </section>

          <section className="progress-panel next-action-panel">
            <span className="next-action-icon">✨</span>

            <div>
              <small>
                {isJapanese
                  ? "次のおすすめ"
                  : "Recommended next step"}
              </small>

              <h2>{nextAction.title}</h2>
              <p>{nextAction.message}</p>

              <button
                className="primary-button"
                type="button"
                onClick={() =>
                  navigate(nextAction.path)
                }
              >
                {nextAction.button}
              </button>
            </div>
          </section>
        </div>

        <div className="student-stat-grid">
          {applicationCards.map((card) => (
            <article
              className="student-stat-card"
              key={card.label}
            >
              <span>{card.icon}</span>

              <div>
                <small>{card.label}</small>
                <strong>{card.value}</strong>
              </div>
            </article>
          ))}
        </div>

        <div className="student-progress-bottom-grid">
          <section className="progress-panel">
            <div className="progress-panel-heading">
              <div>
                <h2>
                  {isJapanese
                    ? "未入力のプロフィール項目"
                    : "Missing profile information"}
                </h2>

                <p>
                  {isJapanese
                    ? "すべて入力してプロフィールを完成させましょう。"
                    : "Complete these fields to strengthen your profile."}
                </p>
              </div>
            </div>

            {progress.missing_fields.length > 0 ? (
              <div className="missing-field-list">
                {progress.missing_fields.map((field) => (
                  <button
                    type="button"
                    key={field}
                    onClick={() => navigate("/profile")}
                  >
                    <span>+</span>
                    {fieldLabels[language][field] || field}
                  </button>
                ))}
              </div>
            ) : (
              <div className="profile-complete-message">
                <span>✅</span>

                <div>
                  <strong>
                    {isJapanese
                      ? "プロフィールが完成しました"
                      : "Your profile is complete"}
                  </strong>

                  <p>
                    {isJapanese
                      ? "すべての項目が入力されています。"
                      : "All profile fields have been completed."}
                  </p>
                </div>
              </div>
            )}
          </section>

          <section className="progress-panel">
            <div className="progress-panel-heading">
              <div>
                <h2>
                  {isJapanese
                    ? "応募状況"
                    : "Application pipeline"}
                </h2>

                <p>
                  {isJapanese
                    ? "現在の応募ステータス"
                    : "Your current application statuses"}
                </p>
              </div>
            </div>

            <div className="student-pipeline">
              <div>
                <span>
                  {isJapanese ? "応募済み" : "Pending"}
                </span>
                <strong>
                  {progress.applications.pending}
                </strong>
              </div>

              <div>
                <span>
                  {isJapanese ? "選考中" : "Reviewing"}
                </span>
                <strong>
                  {progress.applications.reviewing}
                </strong>
              </div>

              <div>
                <span>
                  {isJapanese ? "面接" : "Interview"}
                </span>
                <strong>
                  {progress.applications.interview}
                </strong>
              </div>

              <div>
                <span>
                  {isJapanese ? "採用" : "Accepted"}
                </span>
                <strong>
                  {progress.applications.accepted}
                </strong>
              </div>
            </div>

            <button
              className="secondary-button"
              type="button"
              onClick={() => navigate("/applications")}
            >
              {isJapanese
                ? "応募履歴を見る"
                : "View applications"}
            </button>
          </section>
        </div>
      </section>
    </main>
  );
}

export default StudentProgress;