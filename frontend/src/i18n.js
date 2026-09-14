import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import english from "./locales/en.json";
import japanese from "./locales/ja.json";

const savedLanguage = localStorage.getItem("careerbridge-language") || "en";

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: english,
    },
    ja: {
      translation: japanese,
    },
  },
  lng: savedLanguage,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;