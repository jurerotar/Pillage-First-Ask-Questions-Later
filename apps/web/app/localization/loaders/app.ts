import i18n from 'i18next';
import { env } from 'app/env.ts';
import type { AvailableLocale } from 'app/localization/i18n';

export const loadAppTranslations = async (locale: AvailableLocale) => {
  if (!i18n.hasResourceBundle(locale, 'app')) {
    // Check if we're in production mode and should use hashed files
    const localizationFilesTarget =
      env.NODE_ENV === 'production' ? 'hashed' : 'extracted';

    const appPath = `app/localization/locales/${locale}/${localizationFilesTarget}/app.json`;

    const [{ default: appResources }, { default: assetResources }] =
      await Promise.all([
        import(appPath),
        import(`app/localization/locales/${locale}/assets.json`),
      ]);

    i18n.addResourceBundle(locale, 'app', appResources, true);
    i18n.addResourceBundle(locale, 'app', assetResources, true);
  }
};
