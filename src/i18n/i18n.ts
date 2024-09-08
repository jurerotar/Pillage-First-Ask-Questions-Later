import { isInDevelopmentMode } from 'app/utils/common';
import i18n from 'i18next';
import type { AvailableLocales } from 'interfaces/models/preferences/locale';
import { initReactI18next } from 'react-i18next';
import enUsLocalization from './translations/en-US.json';

const availableLocales: AvailableLocales[] = ['en-US'];

(async () => {
  await i18n.use(initReactI18next).init({
    lng: 'en-US',
    debug: isInDevelopmentMode(),
    fallbackLng: 'en-US',
    load: 'currentOnly',
    supportedLngs: availableLocales,
    returnObjects: false,
    resources: {
      'en-US': {
        translation: enUsLocalization,
      },
    },
  });
})();
