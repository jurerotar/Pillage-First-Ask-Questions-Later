import type { AvailableLocale } from "app/interfaces/models/locale";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getCookie } from "app/utils/device";

const supportedLngs: AvailableLocale[] = ["en-US", "ar-SA"];

// Get initial locale from cookie or default to en-US
const getInitialLocale = (): AvailableLocale => {
  if (typeof document !== "undefined") {
    const cookieLocale = getCookie("locale") as AvailableLocale | null;
    if (cookieLocale && supportedLngs.includes(cookieLocale)) {
      return cookieLocale;
    }
  }
  return "en-US";
};

const initialLocale = getInitialLocale();

await i18n.use(initReactI18next).init({
  lng: initialLocale,
  debug: false,
  fallbackLng: "en-US",
  load: "currentOnly",
  defaultNS: "app",
  supportedLngs,
  interpolation: {
    escapeValue: false,
  },
});
