import i18n from 'i18next';
import { getCookie } from 'app/utils/device';

export const loadAppTranslations = async () => {
  const locale = getCookie('locale') || i18n.language || 'en-US';

  if (!i18n.hasResourceBundle(locale, 'app')) {
    const [{ default: appResources }, { default: assetResources }] =
      await Promise.all([
        import(`app/localization/locales/${locale}/app.json`),
        import(`app/localization/locales/${locale}/assets.json`),
      ]);

    i18n.addResourceBundle(locale, 'app', appResources, true);
    i18n.addResourceBundle(locale, 'app', assetResources, true);
  }
};
