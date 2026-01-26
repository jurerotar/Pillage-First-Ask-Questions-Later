import i18n from 'i18next';
import { env } from 'app/env.ts';
import type { AvailableLocale } from 'app/localization/i18n';

// Pre-load all localization files using import.meta.glob for proper Vite bundling
const hashedPublicFiles = import.meta.glob<{ default: Record<string, string> }>(
  '../locales/*/hashed/public.json',
  { eager: false },
);
const extractedPublicFiles = import.meta.glob<{
  default: Record<string, string>;
}>('../locales/*/extracted/public.json', { eager: false });

export const loadPublicTranslations = async (locale: AvailableLocale) => {
  if (!i18n.hasResourceBundle(locale, 'public')) {
    // Check if we're in production mode and should use hashed files
    const localizationFilesTarget =
      env.NODE_ENV === 'production' ? 'hashed' : 'extracted';

    const publicFiles =
      localizationFilesTarget === 'hashed'
        ? hashedPublicFiles
        : extractedPublicFiles;
    const publicPath = `../locales/${locale}/${localizationFilesTarget}/public.json`;

    const { default: publicResources } = await publicFiles[publicPath]();

    i18n.addResourceBundle(locale, 'public', publicResources, true);
  }
};
