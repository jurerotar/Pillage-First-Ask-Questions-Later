import { isInDevelopmentMode } from 'app/utils/common';
import i18n from 'i18next';
import type { AvailableLocales } from 'interfaces/models/preferences/locale';
import enUsLocalization from 'locales/en-US.json';
import { initReactI18next } from 'react-i18next';

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
