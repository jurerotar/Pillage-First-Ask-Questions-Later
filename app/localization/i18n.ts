import { default as i18next, use } from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { AvailableLocale } from 'app/interfaces/models/locale';

const supportedLngs: AvailableLocale[] = ['en-US'];

export const i18n = i18next;

await use(initReactI18next).init({
  lng: 'en-US',
  debug: false,
  fallbackLng: 'en-US',
  load: 'currentOnly',
  defaultNS: 'app',
  supportedLngs,
  interpolation: {
    escapeValue: false,
  },
});
