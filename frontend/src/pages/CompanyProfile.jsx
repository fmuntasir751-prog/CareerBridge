import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import api, {
  getApiErrorMessage,
} from "../services/api";

const emptyProfile = {
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

  const isJapanese = i18n.language.startsWith("ja");

  const [profile, setProfile] = useState(
    emptyProfile,
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get(
          "/profiles/company/me/",
        );

        setProfile({
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
            response.data.verification_status
            || "pending",
          verification_note:
            response.data.verification_note || "",
          verified_at:
            response.data.verified_at || null,
          is_verified:
            response.data.is_verified || false,
        });
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

  const handleChange = (event) => {
    const { name, value } = event.target;

    setProfile((currentProfile) => ({
      ...currentProfile,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");
    setSaving(true);

    try {
      const response = await api.patch(
        "/profiles/company/me/",
        {
          company_name: profile.company_name,
          description: profile.description,
          website: profile.website,
          location: profile.location,
          registration_number:
            profile.registration_number,
          contact_person:
            profile.contact_person,
        },
      );

      setProfile((currentProfile) => ({
        ...currentProfile,
        ...response.data,
      }));

      setMessage(t("companyProfileSaved"));
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
    if (profile.verification_status === "verified") {
      return {
        icon: "✓",
        title: isJapanese
          ? "認証済み企業"
          : "Verified company",
        description: isJapanese
          ? (
            "企業情報の確認が完了しました。"
            + "求人を公開できます。"
          )
          : (
            "Your company information has been "
            + "verified. You can publish jobs."
          ),
      };
    }

    if (profile.verification_status === "rejected") {
      return {
        icon: "!",
        title: isJapanese
          ? "認証されませんでした"
          : "Verification rejected",
        description: isJapanese
          ? (
            "企業情報を確認し、必要な内容を"
            + "修正してください。"
          )
          : (
            "Review your company information and "
            + "make the required corrections."
          ),
      };
    }

    return {
      icon: "…",
      title: isJapanese
        ? "企業認証を確認中"
        : "Verification pending",
      description: isJapanese
        ? (
          "管理者が企業情報を確認しています。"
          + "認証完了後に求人を公開できます。"
        )
        : (
          "An administrator is reviewing your "
          + "company information. You can publish "
          + "jobs after verification."
        ),
    };
  };

  const verificationContent =
    getVerificationContent();

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
          onClick={() => navigate("/dashboard")}
        >
          ← {t("dashboard")}
        </button>

        <div className="company-profile-heading">
          <div>
            <h1>{t("editCompanyProfile")}</h1>

            <p className="auth-subtitle">
              {t("companyProfileMessage")}
            </p>
          </div>

          <span
            className={
              `verification-badge ${
                profile.verification_status
              }`
            }
          >
            {verificationContent.icon}{" "}
            {profile.is_verified
              ? (
                isJapanese
                  ? "認証済み"
                  : "Verified"
              )
              : (
                profile.verification_status
                === "rejected"
                  ? (
                    isJapanese
                      ? "却下"
                      : "Rejected"
                  )
                  : (
                    isJapanese
                      ? "確認中"
                      : "Pending"
                  )
              )}
          </span>
        </div>

        <section
          className={
            `verification-panel ${
              profile.verification_status
            }`
          }
        >
          <div
            className="verification-panel-icon"
            aria-hidden="true"
          >
            {verificationContent.icon}
          </div>

          <div>
            <h2>{verificationContent.title}</h2>

            <p>
              {verificationContent.description}
            </p>

            {profile.verification_note && (
              <p className="verification-note">
                <strong>
                  {isJapanese
                    ? "管理者からのメモ："
                    : "Administrator note:"}
                </strong>{" "}
                {profile.verification_note}
              </p>
            )}

            {profile.verified_at && (
              <small>
                {isJapanese
                  ? "認証日時："
                  : "Verified on:"}{" "}
                {new Date(
                  profile.verified_at,
                ).toLocaleString(
                  isJapanese ? "ja-JP" : "en-US",
                )}
              </small>
            )}
          </div>
        </section>

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
            {t("companyName")}

            <input
              name="company_name"
              value={profile.company_name}
              onChange={handleChange}
              autoComplete="organization"
              required
            />
          </label>

          <label>
            {t("companyDescription")}

            <textarea
              name="description"
              value={profile.description}
              onChange={handleChange}
              rows="7"
            />
          </label>

          <div className="form-row">
            <label>
              {isJapanese
                ? "法人番号・登録番号"
                : "Company registration number"}

              <input
                name="registration_number"
                value={profile.registration_number}
                onChange={handleChange}
                placeholder={
                  isJapanese
                    ? "会社の登録番号"
                    : "Official registration number"
                }
              />
            </label>

            <label>
              {isJapanese
                ? "担当者名"
                : "Contact person"}

              <input
                name="contact_person"
                value={profile.contact_person}
                onChange={handleChange}
                autoComplete="name"
                placeholder={
                  isJapanese
                    ? "採用担当者名"
                    : "Recruiter or representative"
                }
              />
            </label>
          </div>

          <label>
            {t("website")}

            <input
              type="url"
              name="website"
              value={profile.website}
              onChange={handleChange}
              autoComplete="url"
              placeholder="https://example.com"
            />
          </label>

          <label>
            {t("location")}

            <input
              name="location"
              value={profile.location}
              onChange={handleChange}
              autoComplete="address-level2"
            />
          </label>

          <button
            className="submit-button"
            type="submit"
            disabled={saving}
          >
            {saving
              ? t("saving")
              : t("saveProfile")}
          </button>
        </form>
      </section>
    </main>
  );
}

export default CompanyProfile;