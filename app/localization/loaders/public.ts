import i18n from 'i18next';

export const loadPublicTranslations = async (locale: string) => {
  if (!i18n.hasResourceBundle(locale, 'public')) {
    const { default: publicResources } = await import(
      `app/localization/locales/${locale}/public.json`
    );
    i18n.addResourceBundle(locale, 'public', publicResources, true, true);
  }
};
