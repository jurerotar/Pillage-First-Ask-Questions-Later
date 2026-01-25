import { default as i18next, use } from 'i18next';
import { initReactI18next } from 'react-i18next';

export type AvailableLocale = 'en-US';

export const locales: AvailableLocale[] = ['en-US'];

export const i18n = i18next;

await use(initReactI18next).init({
  lng: 'en-US',
  debug: false,
  fallbackLng: 'en-US',
  load: 'currentOnly',
  defaultNS: 'app',
  supportedLngs: locales,
  interpolation: {
    escapeValue: false,
  },
});
