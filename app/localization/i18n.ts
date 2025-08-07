import type { AvailableLocale } from 'app/interfaces/models/locale';
import { use } from 'i18next';
import { initReactI18next } from 'react-i18next';

export const supportedLngs: AvailableLocale[] = ['en-US'];

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
