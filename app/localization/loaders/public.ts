import i18n from 'i18next';
import type { AvailableLocale } from 'app/interfaces/models/locale';

export const loadPublicTranslations = async (locale: AvailableLocale) => {
  if (!i18n.hasResourceBundle(locale, 'public')) {
    const { default: publicResources } = await import(
      `app/localization/locales/${locale}/public.json`
    );
    i18n.addResourceBundle(locale, 'public', publicResources, true, true);
  }
};
