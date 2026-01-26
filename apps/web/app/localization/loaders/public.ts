import i18n from 'i18next';
import { env } from 'app/env.ts';
import type { AvailableLocale } from 'app/localization/i18n';

export const loadPublicTranslations = async (locale: AvailableLocale) => {
  if (!i18n.hasResourceBundle(locale, 'public')) {
    // Check if we're in production mode and should use hashed files
    const localizationFilesTarget =
      env.NODE_ENV === 'production' ? 'hashed' : 'extracted';

    const publicPath = `app/localization/locales/${locale}/${localizationFilesTarget}/public.json`;

    const { default: publicResources } = await import(publicPath);

    i18n.addResourceBundle(locale, 'public', publicResources, true);
  }
};
