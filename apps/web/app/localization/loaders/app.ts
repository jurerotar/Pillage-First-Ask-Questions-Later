import i18n from 'i18next';
import { env } from 'app/env.ts';
import type { AvailableLocale } from 'app/localization/i18n';

// Pre-load all localization files using import.meta.glob for proper Vite bundling
const hashedAppFiles = import.meta.glob<{ default: Record<string, string> }>(
  '../locales/*/hashed/app.json',
  { eager: false },
);
const extractedAppFiles = import.meta.glob<{ default: Record<string, string> }>(
  '../locales/*/extracted/app.json',
  { eager: false },
);
const assetFiles = import.meta.glob<{ default: Record<string, string> }>(
  '../locales/*/assets.json',
  { eager: false },
);

export const loadAppTranslations = async (locale: AvailableLocale) => {
  if (!i18n.hasResourceBundle(locale, 'app')) {
    // Check if we're in production mode and should use hashed files
    const localizationFilesTarget =
      env.NODE_ENV === 'production' ? 'hashed' : 'extracted';

    const appFiles =
      localizationFilesTarget === 'hashed' ? hashedAppFiles : extractedAppFiles;
    const appPath = `../locales/${locale}/${localizationFilesTarget}/app.json`;
    const assetPath = `../locales/${locale}/assets.json`;

    const [{ default: appResources }, { default: assetResources }] =
      await Promise.all([appFiles[appPath](), assetFiles[assetPath]()]);

    i18n.addResourceBundle(locale, 'app', appResources, true);
    i18n.addResourceBundle(locale, 'app', assetResources, true);
  }
};
