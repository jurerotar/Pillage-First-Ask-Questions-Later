import type { AvailableLocales } from 'app/interfaces/models/locale';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const supportedLngs: AvailableLocales[] = ['en-US'];

await i18n.use(initReactI18next).init({
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
