import type { AvailableLocales } from 'app/interfaces/models/locale';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enUsLocalization from '../locales/en-US.json';

const supportedLngs: AvailableLocales[] = ['en-US'];

i18n.use(initReactI18next).init({
  lng: 'en-US',
  debug: false,
  fallbackLng: 'en-US',
  load: 'currentOnly',
  supportedLngs,
  resources: {
    'en-US': {
      translation: enUsLocalization,
    },
  },
});
