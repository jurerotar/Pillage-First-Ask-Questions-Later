import i18n from "i18next";
import { setCookie, getCookie } from "app/utils/device";
import type { AvailableLocale } from "app/interfaces/models/locale";
import type { Preferences } from "app/interfaces/models/game/preferences";

/**
 * Synchronizes the locale from preferences with i18n and cookies
 * @param preferences - The user preferences containing the locale
 */
export const syncLocaleFromPreferences = async (
  preferences: Preferences,
): Promise<void> => {
  const { locale } = preferences;

  // Only sync if the locale is different from current i18n language
  if (i18n.language !== locale) {
    try {
      // Update i18n language
      await i18n.changeLanguage(locale);

      // Set cookie for translation loaders
      setCookie("locale", locale);

      // Load translations for the locale if not already loaded
      if (!i18n.hasResourceBundle(locale, "app")) {
        const [{ default: appResources }, { default: assetResources }] =
          await Promise.all([
            import(`app/localization/locales/${locale}/app.json`),
            import(`app/localization/locales/${locale}/assets.json`),
          ]);

        i18n.addResourceBundle(locale, "app", appResources, true);
        i18n.addResourceBundle(locale, "app", assetResources, true);
      }
    } catch (error) {
      console.error(`Failed to sync locale ${locale}:`, error);
    }
  }
};

/**
 * Synchronizes the locale from cookies with i18n
 * Used when worker context changes locale and notifies main thread
 */
export const syncLocaleFromCookie = async (): Promise<void> => {
  const cookieLocale = getCookie("locale") as AvailableLocale | null;

  if (cookieLocale && cookieLocale !== i18n.language) {
    try {
      // Update i18n language
      await i18n.changeLanguage(cookieLocale);

      // Load translations for the locale if not already loaded
      if (!i18n.hasResourceBundle(cookieLocale, "app")) {
        const [{ default: appResources }, { default: assetResources }] =
          await Promise.all([
            import(`app/localization/locales/${cookieLocale}/app.json`),
            import(`app/localization/locales/${cookieLocale}/assets.json`),
          ]);

        i18n.addResourceBundle(cookieLocale, "app", appResources, true);
        i18n.addResourceBundle(cookieLocale, "app", assetResources, true);
      }
    } catch (error) {
      console.error(
        `Failed to sync locale from cookie ${cookieLocale}:`,
        error,
      );
    }
  }
};

/**
 * Initializes the locale from cookies or preferences on app startup
 */
export const initializeLocaleFromStorage = async (): Promise<void> => {
  const cookieLocale = getCookie("locale") as AvailableLocale | null;

  if (cookieLocale && cookieLocale !== i18n.language) {
    try {
      await i18n.changeLanguage(cookieLocale);
    } catch (error) {
      console.error(
        `Failed to initialize locale from cookie ${cookieLocale}:`,
        error,
      );
    }
  }
};
