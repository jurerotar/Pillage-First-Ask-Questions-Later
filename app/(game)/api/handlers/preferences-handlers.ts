import type { ApiHandler } from 'app/interfaces/api';
import type { Preferences } from 'app/interfaces/models/game/preferences';
import { preferencesCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import i18n from 'i18next';
import { setCookie } from 'app/utils/device';
import type { AvailableLocale } from 'app/interfaces/models/locale';

export const getPreferences: ApiHandler<Preferences> = async (queryClient) => {
  return queryClient.getQueryData<Preferences>([preferencesCacheKey])!;
};

type UpdatePreferenceBody = {
  value: Preferences[keyof Preferences];
};

export const updatePreference: ApiHandler<
  void,
  'preferenceName',
  UpdatePreferenceBody
> = async (queryClient, args) => {
  const { body, params } = args;

  const { preferenceName } = params;
  const { value } = body;

  // Handle locale preference changes
  if (preferenceName === 'locale') {
    const locale = value as AvailableLocale;

    try {
      // Check if we're in a worker context where i18n might not be available
      if (typeof window !== 'undefined' && i18n) {
        // Main thread context - handle i18n directly
        await i18n.changeLanguage(locale);
        setCookie('locale', locale);

        // Load translations for the new locale if not already loaded
        if (!i18n.hasResourceBundle(locale, 'app')) {
          try {
            const [{ default: appResources }, { default: assetResources }] =
              await Promise.all([
                import(`app/localization/locales/${locale}/app.json`),
                import(`app/localization/locales/${locale}/assets.json`),
              ]);

            i18n.addResourceBundle(locale, 'app', appResources, true);
            i18n.addResourceBundle(locale, 'app', assetResources, true);
          } catch (error) {
            console.error(
              `Failed to load translations for locale ${locale}:`,
              error,
            );
          }
        }
      } else {
        // Worker context - set cookie and notify main thread
        if (typeof document !== 'undefined') {
          setCookie('locale', locale);
        }

        // Post message to main thread to handle locale change
        if (typeof self !== 'undefined' && self.postMessage) {
          self.postMessage({
            eventKey: 'event:locale-changed',
            locale: locale,
          });
        }
      }
    } catch (error) {
      console.error(`Failed to handle locale change to ${locale}:`, error);
    }
  }

  queryClient.setQueryData<Preferences>(
    [preferencesCacheKey],
    (prevPreferences) => {
      return {
        ...prevPreferences!,
        [preferenceName]: value,
      };
    },
  );
};
