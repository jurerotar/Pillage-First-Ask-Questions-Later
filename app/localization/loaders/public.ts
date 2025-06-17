import i18n from 'i18next';
import { getCookie } from 'app/utils/device';

export const loadPublicTranslations = async () => {
  const locale = getCookie('locale') || 'en-US';

  if (!i18n.hasResourceBundle(locale, 'public')) {
    const { default: publicResources } = await import(
      `app/localization/locales/${locale}/public.json`
    );
    i18n.addResourceBundle(locale, 'public', publicResources, true, true);
  }
};
