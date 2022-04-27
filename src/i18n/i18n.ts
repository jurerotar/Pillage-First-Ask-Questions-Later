import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { AvailableLocales } from 'interfaces/models/preferences/locale';
// eslint-disable-next-line import/extensions
import EnUSLocalization from 'i18n/translations/en-US.json';
// eslint-disable-next-line import/extensions
import SlSLLocalization from 'i18n/translations/sl-SL.json';

const availableLocales: AvailableLocales[] = ['en-US', 'sl-SL'];

(async () => {
  await i18n.use(initReactI18next)
    .init({
      lng: 'en-US',
      debug: true,
      fallbackLng: 'en-US',
      load: 'currentOnly',
      supportedLngs: availableLocales,
      resources: {
        'en-US': {
          translation: EnUSLocalization
        },
        'sl-SL': {
          translation: SlSLLocalization
        }
      }
    });
})();
