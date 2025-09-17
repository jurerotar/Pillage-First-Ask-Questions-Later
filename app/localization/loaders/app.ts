import i18n from 'i18next';
import type { AvailableLocale } from 'app/interfaces/models/locale';

export const loadAppTranslations = async (locale: AvailableLocale) => {
  if (!i18n.hasResourceBundle(locale, 'app')) {
    const [{ default: appResources }, { default: assetResources }] =
      await Promise.all([
        import(`app/localization/locales/${locale}/app.json`),
        import(`app/localization/locales/${locale}/assets.json`),
      ]);

    i18n.addResourceBundle(locale, 'app', appResources, true);
    i18n.addResourceBundle(locale, 'app', assetResources, true);
  }

  // biome-ignore lint/suspicious/noConsole: a
  console.log(i18n);
};
