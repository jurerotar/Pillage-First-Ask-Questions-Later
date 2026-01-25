import i18n from 'i18next';
import type { AvailableLocale } from 'app/localization/i18n';

export const loadAppTranslations = async (locale: AvailableLocale) => {
  if (!i18n.hasResourceBundle(locale, 'app')) {
    // Check if we're in production mode and should use hashed files
    const useHashed = process.env.NODE_ENV === 'production' &&
                     process.env.USE_I18N_HASHED === 'true';
    
    const appPath = useHashed
      ? `app/localization/locales/${locale}/hashed/app.json`
      : `app/localization/locales/${locale}/extracted/app.json`;
    
    try {
      const [{ default: appResources }, { default: assetResources }] =
        await Promise.all([
          import(appPath),
          import(`app/localization/locales/${locale}/assets.json`),
        ]);

      i18n.addResourceBundle(locale, 'app', appResources, true);
      i18n.addResourceBundle(locale, 'app', assetResources, true);
    } catch (error) {
      console.warn(`Failed to load ${useHashed ? 'hashed' : 'extracted'} localization files, falling back to extracted files`, error);
      
      // Fallback to extracted files if hashed files fail to load
      const [{ default: appResources }, { default: assetResources }] =
        await Promise.all([
          import(`app/localization/locales/${locale}/extracted/app.json`),
          import(`app/localization/locales/${locale}/assets.json`),
        ]);

      i18n.addResourceBundle(locale, 'app', appResources, true);
      i18n.addResourceBundle(locale, 'app', assetResources, true);
    }
  }
};
