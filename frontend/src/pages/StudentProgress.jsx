import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import DashboardHeader from "../components/DashboardHeader";
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

const nextActions = {
  complete_profile: {
    path: "/profile",
    en: [
      "Complete your profile",
      "A complete profile helps companies understand your skills and experience.",
      "Edit profile",
    ],
    ja: [
      "プロフィールを完成させましょう",
      "プロフィールを完成させると、企業にスキルや経験が伝わりやすくなります。",
      "プロフィール編集",
    ],
  },
  apply_for_jobs: {
    path: "/jobs",
    en: [
      "Start applying for jobs",
      "Your profile is ready. Browse available jobs and submit your first application.",
      "Browse jobs",
    ],
    ja: [
      "求人に応募しましょう",
      "プロフィールの準備ができました。求人を探して最初の応募をしましょう。",
      "求人を探す",
    ],
  },
  prepare_for_interview: {
    path: "/dashboard",
    en: [
      "Prepare for your interview",
      "You have an interview opportunity. Use the AI career assistant to practise.",
      "Open dashboard",
    ],
    ja: [
      "面接の準備をしましょう",
      "面接の機会があります。AIキャリアアシスタントで練習しましょう。",
      "ダッシュボード",
    ],
  },
  continue_job_search: {
    path: "/jobs",
    en: [
      "Continue your job search",
      "Keep exploring suitable opportunities and save interesting jobs.",
      "Browse jobs",
    ],
    ja: [
      "就職活動を続けましょう",
      "自分に合う求人を探し、気になる求人を保存しましょう。",
      "求人を探す",
    ],
  },
};

function StudentProgress() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const isJapanese = i18n.language.startsWith("ja");
  const language = isJapanese ? "ja" : "en";

  useEffect(() => {
    let active = true;

    async function loadProgress() {
      try {
        const { data } = await api.get("/profiles/student/progress/");

        if (active) setProgress(data);
      } catch {
        if (active) setLoadFailed(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProgress();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="page-loading" role="status">
        {isJapanese ? "読み込み中..." : "Loading..."}
      </div>
    );
  }

  if (loadFailed || !progress) {
    return (
      <main className="student-progress-page">
        <DashboardHeader role="student" />

        <section className="student-progress-content">
          <div className="form-message error" role="alert">
            {isJapanese
              ? "キャリア進捗を読み込めませんでした。"
              : "Could not load your career progress."}
          </div>
        </section>
      </main>
    );
  }

  const applications = progress.applications;
  const missingFields = progress.missing_fields;
  const hasMissingFields = missingFields.length > 0;

  const nextAction =
    nextActions[progress.next_action] || nextActions.continue_job_search;
  const [actionTitle, actionMessage, actionButton] = nextAction[language];

  const stats = [
    ["total", isJapanese ? "応募数" : "Applications", applications.total, "📨"],
    ["reviewing", isJapanese ? "選考中" : "Reviewing", applications.reviewing, "🔍"],
    ["interview", isJapanese ? "面接" : "Interviews", applications.interview, "💬"],
    ["accepted", isJapanese ? "採用" : "Accepted", applications.accepted, "🎉"],
    ["saved", isJapanese ? "保存した求人" : "Saved jobs", progress.saved_jobs, "🔖"],
  ];

  const pipeline = [
    ["pending", isJapanese ? "応募済み" : "Pending"],
    ["reviewing", isJapanese ? "選考中" : "Reviewing"],
    ["interview", isJapanese ? "面接" : "Interview"],
    ["accepted", isJapanese ? "採用" : "Accepted"],
  ];

  const completionLabel = isJapanese ? "プロフィール完成度" : "Profile completion";

  return (
    <main className="student-progress-page">
      <DashboardHeader role="student" />

      <section className="student-progress-content">
        <p className="eyebrow">
          {isJapanese ? "キャリア活動" : "Career activity"}
        </p>

        <div className="student-progress-title">
          <div>
            <h1>{isJapanese ? "キャリア進捗" : "Career progress"}</h1>
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
              style={{ "--completion": `${progress.profile_completion}%` }}
              role="progressbar"
              aria-label={completionLabel}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Number(progress.profile_completion)}
            >
              <div>
                <strong>{progress.profile_completion}%</strong>
                <span>{isJapanese ? "完了" : "complete"}</span>
              </div>
            </div>

            <div>
              <h2>{completionLabel}</h2>
              <p>
                {progress.completed_fields} / {progress.total_fields}{" "}
                {isJapanese ? "項目が入力済みです。" : "profile fields completed."}
              </p>

              <button
                className="secondary-button"
                type="button"
                onClick={() => navigate("/profile")}
              >
                {isJapanese ? "プロフィール編集" : "Edit profile"}
              </button>
            </div>
          </section>

          <section className="progress-panel next-action-panel">
            <span className="next-action-icon" aria-hidden="true">✨</span>
            <div>
              <small>{isJapanese ? "次のおすすめ" : "Recommended next step"}</small>
              <h2>{actionTitle}</h2>
              <p>{actionMessage}</p>

              <button
                className="primary-button"
                type="button"
                onClick={() => navigate(nextAction.path)}
              >
                {actionButton}
              </button>
            </div>
          </section>
        </div>

        <div className="student-stat-grid">
          {stats.map(([key, label, value, icon]) => (
            <article className="student-stat-card" key={key}>
              <span aria-hidden="true">{icon}</span>
              <div>
                <small>{label}</small>
                <strong>{value}</strong>
              </div>
            </article>
          ))}
        </div>

        <div className="student-progress-bottom-grid">
          <section className="progress-panel">
            <div className="progress-panel-heading">
              <div>
                <h2>
                  {hasMissingFields
                    ? isJapanese ? "未入力のプロフィール項目" : "Missing profile information"
                    : isJapanese ? "プロフィールの状態" : "Profile status"}
                </h2>
                <p>
                  {hasMissingFields
                    ? isJapanese
                      ? "すべて入力してプロフィールを完成させましょう。"
                      : "Complete these fields to strengthen your profile."
                    : isJapanese
                      ? "プロフィールは求人マッチングの準備ができています。"
                      : "Your profile is ready for job matching."}
                </p>
              </div>
            </div>

            {hasMissingFields ? (
              <div className="missing-field-list">
                {missingFields.map((field) => (
                  <button
                    key={field}
                    type="button"
                    onClick={() => navigate("/profile")}
                  >
                    <span aria-hidden="true">+</span>
                    {fieldLabels[language][field] || field}
                  </button>
                ))}
              </div>
            ) : (
              <div className="profile-complete-message">
                <span aria-hidden="true">✅</span>
                <div>
                  <strong>
                    {isJapanese ? "プロフィールが完成しました" : "Your profile is complete"}
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
                <h2>{isJapanese ? "応募状況" : "Application pipeline"}</h2>
                <p>
                  {isJapanese ? "現在の応募ステータス" : "Your current application statuses"}
                </p>
              </div>
            </div>

            <div className="student-pipeline">
              {pipeline.map(([key, label]) => (
                <div key={key}>
                  <span>{label}</span>
                  <strong>{applications[key]}</strong>
                </div>
              ))}
            </div>

            <button
              className="secondary-button"
              type="button"
              onClick={() => navigate("/applications")}
            >
              {isJapanese ? "応募履歴を見る" : "View applications"}
            </button>
          </section>
        </div>
      </section>
    </main>
  );
}

export default StudentProgress;