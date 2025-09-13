import type { AvailableLocale } from 'app/interfaces/models/locale';
import { use } from 'i18next';
import { initReactI18next } from 'react-i18next';

export const supportedLngs: AvailableLocale[] = ['en-us'];

await use(initReactI18next).init({
  lng: 'en-us',
  debug: false,
  fallbackLng: 'en-us',
  load: 'currentOnly',
  defaultNS: 'app',
  supportedLngs,
  interpolation: {
    escapeValue: false,
  },
});
