import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import api, {
  getApiErrorMessage,
} from "../services/api";

const MAX_LOGO_SIZE = 5 * 1024 * 1024;

const emptyProfile = {
  username: "",
  email: "",
  company_name: "",
  description: "",
  website: "",
  location: "",
  registration_number: "",
  contact_person: "",
  verification_status: "pending",
  verification_note: "",
  verified_at: null,
  is_verified: false,
};

function CompanyProfile() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const isJapanese =
    i18n.language.startsWith("ja");

  const [profile, setProfile] =
    useState(emptyProfile);

  const [currentLogo, setCurrentLogo] =
    useState("");

  const [logo, setLogo] = useState(null);
  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get(
          "/profiles/company/me/",
        );

        setProfile({
          username:
            response.data.username || "",
          email:
            response.data.email || "",
          company_name:
            response.data.company_name || "",
          description:
            response.data.description || "",
          website:
            response.data.website || "",
          location:
            response.data.location || "",
          registration_number:
            response.data.registration_number || "",
          contact_person:
            response.data.contact_person || "",
          verification_status:
            response.data.verification_status ||
            "pending",
          verification_note:
            response.data.verification_note || "",
          verified_at:
            response.data.verified_at || null,
          is_verified: Boolean(
            response.data.is_verified,
          ),
        });

        setCurrentLogo(
          response.data.logo || "",
        );
      } catch (requestError) {
        setError(
          getApiErrorMessage(
            requestError,
            t("profileLoadError"),
          ),
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [t]);

  const requiredFields = useMemo(
    () => [
      {
        key: "company_name",
        label: isJapanese
          ? "企業名"
          : "Company name",
        complete: Boolean(
          profile.company_name.trim(),
        ),
      },
      {
        key: "description",
        label: isJapanese
          ? "企業説明"
          : "Company description",
        complete: Boolean(
          profile.description.trim(),
        ),
      },
      {
        key: "registration_number",
        label: isJapanese
          ? "法人番号・登録番号"
          : "Registration number",
        complete: Boolean(
          profile.registration_number.trim(),
        ),
      },
      {
        key: "contact_person",
        label: isJapanese
          ? "採用担当者"
          : "Contact person",
        complete: Boolean(
          profile.contact_person.trim(),
        ),
      },
      {
        key: "website",
        label: isJapanese
          ? "企業Webサイト"
          : "Company website",
        complete: Boolean(
          profile.website.trim(),
        ),
      },
      {
        key: "location",
        label: isJapanese
          ? "所在地"
          : "Location",
        complete: Boolean(
          profile.location.trim(),
        ),
      },
    ],
    [isJapanese, profile],
  );

  const completedFieldCount =
    requiredFields.filter(
      (field) => field.complete,
    ).length;

  const completionPercentage = Math.round(
    (
      completedFieldCount /
      requiredFields.length
    ) * 100,
  );

  const missingFields =
    requiredFields.filter(
      (field) => !field.complete,
    );

  const logoPreviewUrl = useMemo(
    () => (
      logo
        ? URL.createObjectURL(logo)
        : ""
    ),
    [logo],
  );

  useEffect(
    () => () => {
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    },
    [logoPreviewUrl],
  );

  const logoPreview =
    logoPreviewUrl || currentLogo;

  const handleChange = (event) => {
    const { name, value } =
      event.target;

    setProfile((currentProfile) => ({
      ...currentProfile,
      [name]: value,
    }));
  };

  const handleLogoChange = (event) => {
    const selectedFile =
      event.target.files?.[0];

    setError("");

    if (!selectedFile) {
      setLogo(null);
      return;
    }

    if (
      !selectedFile.type.startsWith(
        "image/",
      )
    ) {
      setError(
        isJapanese
          ? "画像ファイルを選択してください。"
          : "Please select an image file.",
      );

      event.target.value = "";
      return;
    }

    if (selectedFile.size > MAX_LOGO_SIZE) {
      setError(
        isJapanese
          ? "ロゴ画像は5MB以下にしてください。"
          : "The logo image must be 5 MB or smaller.",
      );

      event.target.value = "";
      return;
    }

    setLogo(selectedFile);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");
    setSaving(true);

    const formData = new FormData();

    formData.append(
      "company_name",
      profile.company_name,
    );

    formData.append(
      "description",
      profile.description,
    );

    formData.append(
      "website",
      profile.website,
    );

    formData.append(
      "location",
      profile.location,
    );

    formData.append(
      "registration_number",
      profile.registration_number,
    );

    formData.append(
      "contact_person",
      profile.contact_person,
    );

    if (logo) {
      formData.append("logo", logo);
    }

    try {
      const response = await api.patch(
        "/profiles/company/me/",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        },
      );

      setProfile((currentProfile) => ({
        ...currentProfile,
        username:
          response.data.username ||
          currentProfile.username,
        email:
          response.data.email ||
          currentProfile.email,
        company_name:
          response.data.company_name || "",
        description:
          response.data.description || "",
        website:
          response.data.website || "",
        location:
          response.data.location || "",
        registration_number:
          response.data.registration_number ||
          "",
        contact_person:
          response.data.contact_person || "",
        verification_status:
          response.data.verification_status ||
          currentProfile.verification_status,
        verification_note:
          response.data.verification_note ||
          "",
        verified_at:
          response.data.verified_at || null,
        is_verified: Boolean(
          response.data.is_verified,
        ),
      }));

      setCurrentLogo(
        response.data.logo ||
        currentLogo,
      );

      setLogo(null);

      setMessage(
        isJapanese
          ? "企業プロフィールを保存しました。"
          : "Company profile saved successfully.",
      );
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          t("profileSaveError"),
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const getVerificationContent = () => {
    if (
      profile.verification_status ===
      "verified"
    ) {
      return {
        icon: "✓",
        badge: isJapanese
          ? "認証済み"
          : "Verified",
        title: isJapanese
          ? "企業認証が完了しています"
          : "Your company is verified",
        description: isJapanese
          ? (
            "求人を作成して学生向けに"
            + "公開できます。"
          )
          : (
            "You can create and publish "
            + "jobs for students."
          ),
      };
    }

    if (
      profile.verification_status ===
      "rejected"
    ) {
      return {
        icon: "!",
        badge: isJapanese
          ? "要修正"
          : "Action required",
        title: isJapanese
          ? "企業情報の修正が必要です"
          : "Company information needs attention",
        description: isJapanese
          ? (
            "管理者のメモを確認し、"
            + "企業情報を修正してください。"
          )
          : (
            "Review the administrator note "
            + "and update your company details."
          ),
      };
    }

    return {
      icon: "…",
      badge: isJapanese
        ? "確認中"
        : "Pending",
      title: isJapanese
        ? "企業認証を確認中です"
        : "Verification is in progress",
      description: isJapanese
        ? (
          "認証完了までは求人を下書きとして"
          + "保存できます。"
        )
        : (
          "You can save job drafts while "
          + "your information is reviewed."
        ),
    };
  };

  const verificationContent =
    getVerificationContent();

  const isVerified =
    profile.verification_status ===
    "verified";

  const missingFieldsIntro = isVerified
    ? isJapanese
      ? "任意：残りの企業情報も入力すると、プロフィールがより充実します。"
      : "Optional: complete the remaining details to strengthen your profile."
    : isJapanese
      ? "認証申請のため、次の情報を追加してください。"
      : "Add the following information for verification.";

  if (loading) {
    return (
      <div className="page-loading">
        {t("loading")}
      </div>
    );
  }

  return (
    <main className="company-profile-page">
      <header className="profile-editor-header">
        <button
          className="back-button"
          type="button"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          ←{" "}
          {isJapanese
            ? "ダッシュボード"
            : "Dashboard"}
        </button>

        <div>
          <p className="eyebrow">
            {isJapanese
              ? "企業アカウント"
              : "Company account"}
          </p>

          <h1>
            {isJapanese
              ? "企業プロフィール"
              : "Company profile"}
          </h1>

          <p>
            {isJapanese
              ? (
                "企業情報を完成させ、"
                + "信頼できる求人を公開しましょう。"
              )
              : (
                "Complete your company details "
                + "and publish trusted job opportunities."
              )}
          </p>
        </div>
      </header>

      {message && (
        <div
          className="form-message success"
          role="status"
        >
          {message}
        </div>
      )}

      {error && (
        <div
          className="form-message error"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="company-profile-layout">
        <form
          className="company-profile-form"
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
                  <path d="M3 21h18" />
                  <path d="M6 21V5l6-2 6 2v16" />
                  <path d="M9 9h1" />
                  <path d="M14 9h1" />
                  <path d="M9 13h1" />
                  <path d="M14 13h1" />
                  <path d="M10 21v-4h4v4" />
                </svg>
              </span>

              <div>
                <h2>
                  {isJapanese
                    ? "企業の基本情報"
                    : "Company information"}
                </h2>

                <p>
                  {isJapanese
                    ? "学生に表示される企業情報です。"
                    : "This information is visible to students."}
                </p>
              </div>
            </div>

            <div className="company-logo-editor">
              <div className="company-logo-preview">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt={
                      isJapanese
                        ? "企業ロゴ"
                        : "Company logo"
                    }
                  />
                ) : (
                  <span aria-hidden="true">
                    {profile.company_name
                      .trim()
                      .charAt(0)
                      .toUpperCase() || "C"}
                  </span>
                )}
              </div>

              <div>
                <strong>
                  {isJapanese
                    ? "企業ロゴ"
                    : "Company logo"}
                </strong>

                <p>
                  {isJapanese
                    ? "PNG、JPG、WebP・最大5MB"
                    : "PNG, JPG or WebP · Maximum 5 MB"}
                </p>

                <label className="file-select-button">
                  {isJapanese
                    ? "ロゴを選択"
                    : "Choose logo"}

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleLogoChange}
                  />
                </label>

                {logo && (
                  <small>
                    {logo.name}
                  </small>
                )}
              </div>
            </div>

            <div className="form-row">
              <label
                className={
                  !profile.company_name.trim()
                    ? "field-required"
                    : ""
                }
              >
                <span className="field-label">
                  {t("companyName")}
                  <span
                    className="required-mark"
                    aria-hidden="true"
                  >
                    *
                  </span>
                </span>

                <input
                  name="company_name"
                  value={profile.company_name}
                  onChange={handleChange}
                  autoComplete="organization"
                  required
                />
              </label>

              <label
                className={
                  !profile.contact_person.trim()
                    ? "field-required"
                    : ""
                }
              >
                <span className="field-label">
                  {isJapanese
                    ? "採用担当者名"
                    : "Contact person"}
                  <span
                    className="required-mark"
                    aria-hidden="true"
                  >
                    *
                  </span>
                </span>

                <input
                  name="contact_person"
                  value={profile.contact_person}
                  onChange={handleChange}
                  autoComplete="name"
                  placeholder={
                    isJapanese
                      ? "採用担当者または代表者"
                      : "Recruiter or representative"
                  }
                  required
                />
              </label>
            </div>

            <label
              className={
                !profile.description.trim()
                  ? "field-required"
                  : ""
              }
            >
              <span className="field-label">
                {t("companyDescription")}
                <span
                  className="required-mark"
                  aria-hidden="true"
                >
                  *
                </span>
              </span>

              <textarea
                name="description"
                value={profile.description}
                onChange={handleChange}
                rows="7"
                maxLength={1000}
                placeholder={
                  isJapanese
                    ? (
                      "事業内容、企業文化、"
                      + "採用する人材について説明してください。"
                    )
                    : (
                      "Describe your business, culture "
                      + "and the people you want to hire."
                    )
                }
                required
              />

              <small>
                {profile.description.length}/1000
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
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                  />
                  <path d="M3 12h18" />
                  <path d="M12 3c3 3 3 15 0 18" />
                  <path d="M12 3c-3 3-3 15 0 18" />
                </svg>
              </span>

              <div>
                <h2>
                  {isJapanese
                    ? "所在地とWebサイト"
                    : "Location and website"}
                </h2>

                <p>
                  {isJapanese
                    ? "企業の公式情報を入力してください。"
                    : "Add your official company information."}
                </p>
              </div>
            </div>

            <div className="form-row">
              <label
                className={
                  !profile.location.trim()
                    ? "field-required"
                    : ""
                }
              >
                <span className="field-label">
                  {t("location")}
                  <span
                    className="required-mark"
                    aria-hidden="true"
                  >
                    *
                  </span>
                </span>

                <input
                  name="location"
                  value={profile.location}
                  onChange={handleChange}
                  autoComplete="address-level2"
                  placeholder="Osaka, Japan"
                  required
                />
              </label>

              <label
                className={
                  !profile.website.trim()
                    ? "field-required"
                    : ""
                }
              >
                <span className="field-label">
                  {t("website")}
                  <span
                    className="required-mark"
                    aria-hidden="true"
                  >
                    *
                  </span>
                </span>

                <input
                  type="url"
                  name="website"
                  value={profile.website}
                  onChange={handleChange}
                  autoComplete="url"
                  placeholder="https://example.com"
                  required
                />
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
                  <rect
                    x="4"
                    y="3"
                    width="16"
                    height="18"
                    rx="2"
                  />
                  <path d="M8 8h8" />
                  <path d="M8 12h8" />
                  <path d="M8 16h5" />
                </svg>
              </span>

              <div>
                <h2>
                  {isJapanese
                    ? "企業認証情報"
                    : "Verification information"}
                </h2>

                <p>
                  {isJapanese
                    ? "求人公開前に管理者が確認します。"
                    : "An administrator reviews this before job publishing."}
                </p>
              </div>
            </div>

            <label
              className={
                !profile.registration_number.trim()
                  ? "field-required"
                  : ""
              }
            >
              <span className="field-label">
                {isJapanese
                  ? "法人番号・登録番号"
                  : "Company registration number"}
                <span
                  className="required-mark"
                  aria-hidden="true"
                >
                  *
                </span>
              </span>

              <input
                name="registration_number"
                value={
                  profile.registration_number
                }
                onChange={handleChange}
                placeholder={
                  isJapanese
                    ? "企業の正式な登録番号"
                    : "Official company registration number"
                }
                required
              />
            </label>

            <div className="company-account-summary">
              <div>
                <small>
                  {isJapanese
                    ? "ユーザー名"
                    : "Username"}
                </small>

                <strong>
                  {profile.username || "—"}
                </strong>
              </div>

              <div>
                <small>
                  {isJapanese
                    ? "登録メール"
                    : "Account email"}
                </small>

                <strong>
                  {profile.email || "—"}
                </strong>
              </div>
            </div>
          </section>

          <div className="profile-form-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() =>
                navigate("/dashboard")
              }
            >
              {isJapanese
                ? "キャンセル"
                : "Cancel"}
            </button>

            <button
              className="submit-button"
              type="submit"
              disabled={saving}
            >
              {saving
                ? (
                  isJapanese
                    ? "保存中..."
                    : "Saving..."
                )
                : (
                  isJapanese
                    ? "プロフィールを保存"
                    : "Save company profile"
                )}
            </button>
          </div>
        </form>

        <aside className="company-profile-sidebar">
          <section className="company-readiness-card">
            <div className="company-readiness-heading">
              <div>
                <p className="eyebrow">
                  {isJapanese
                    ? "プロフィール完成度"
                    : "Profile readiness"}
                </p>

                <h2>
                  {completionPercentage}%
                </h2>
              </div>

              <span
                aria-label={
                  isJapanese
                    ? `${requiredFields.length}項目中${completedFieldCount}項目入力済み`
                    : `${completedFieldCount} of ${requiredFields.length} fields complete`
                }
              >
                {completionPercentage === 100
                  ? "✓"
                  : `${completedFieldCount}/${requiredFields.length}`}
              </span>
            </div>

            <div
              className="company-readiness-progress"
              role="progressbar"
              aria-label={
                isJapanese
                  ? "企業プロフィール完成度"
                  : "Company profile completion"
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

            {missingFields.length > 0 ? (
              <>
                <p>{missingFieldsIntro}</p>

                <ul className="company-profile-checklist">
                  {requiredFields.map((field) => (
                    <li
                      className={
                        field.complete
                          ? "complete"
                          : ""
                      }
                      key={field.key}
                    >
                      <span aria-hidden="true">
                        {field.complete
                          ? "✓"
                          : "○"}
                      </span>

                      {field.label}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="company-profile-ready">
                ✓{" "}
                {isJapanese
                  ? "必要な企業情報が入力されています。"
                  : "All required company details are complete."}
              </p>
            )}
          </section>

          <section
            className={
              `company-verification-card ${
                profile.verification_status
              }`
            }
          >
            <div className="company-verification-title">
              <span aria-hidden="true">
                {verificationContent.icon}
              </span>

              <div>
                <small>
                  {verificationContent.badge}
                </small>

                <h2>
                  {verificationContent.title}
                </h2>
              </div>
            </div>

            <p>
              {verificationContent.description}
            </p>

            {profile.verification_note && (
              <div className="verification-note">
                <strong>
                  {isJapanese
                    ? "管理者からのメモ"
                    : "Administrator note"}
                </strong>

                <p>
                  {profile.verification_note}
                </p>
              </div>
            )}

            {profile.verified_at && (
              <small>
                {isJapanese
                  ? "認証日時："
                  : "Verified on:"}{" "}
                {new Date(
                  profile.verified_at,
                ).toLocaleString(
                  isJapanese
                    ? "ja-JP"
                    : "en-US",
                  {
                    dateStyle: "medium",
                    timeStyle: "short",
                  },
                )}
              </small>
            )}

            {profile.is_verified && (
              <button
                className="primary-button"
                type="button"
                onClick={() =>
                  navigate("/jobs/new")
                }
              >
                {isJapanese
                  ? "求人を作成"
                  : "Create a job"}
              </button>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}

export default CompanyProfile;
