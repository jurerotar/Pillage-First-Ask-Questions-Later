import type { AvailableLocales } from 'app/interfaces/models/locale';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enUsAppLocalization from '../locales/en-US/app.json';
import enUsAssetsLocalization from '../locales/en-US/assets.json';

const supportedLngs: AvailableLocales[] = ['en-US'];

i18n.use(initReactI18next).init({
  lng: 'en-US',
  debug: false,
  fallbackLng: 'en-US',
  load: 'currentOnly',
  supportedLngs,
  interpolation: {
    escapeValue: false,
  },
  resources: {
    'en-US': {
      translation: {
        ...enUsAppLocalization,
        ...enUsAssetsLocalization,
      },
    },
  },
});
