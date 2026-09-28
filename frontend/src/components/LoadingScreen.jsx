import { useTranslation } from "react-i18next";

function LoadingScreen() {
  const { t } = useTranslation();

  return (
    <main
      className="loading-screen"
      role="status"
      aria-live="polite"
    >
      <div className="loading-spinner" aria-hidden="true" />

      <p className="loading-brand">
        CareerBridge
      </p>

      <p className="loading-message">
        {t("loadingMessage")}
      </p>
    </main>
  );
}

export default LoadingScreen;