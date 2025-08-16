import type { AvailableLocale } from 'app/interfaces/models/locale';

const RTL_LANGUAGE_CODES = [
  'ar', // Arabic
  'dv', // Divehi
  'fa', // Persian (Farsi)
  'he', // Hebrew
  'ku', // Kurdish (Sorani - Arabic script)
  'ps', // Pashto
  'sd', // Sindhi
  'ug', // Uyghur
  'ur', // Urdu
  'yi', // Yiddish
];

const isRTLLocale = (locale: AvailableLocale): boolean => {
  return RTL_LANGUAGE_CODES.some((rtlLang) => locale.startsWith(rtlLang));
};

const getTextDirection = (locale: AvailableLocale): 'rtl' | 'ltr' => {
  return isRTLLocale(locale) ? 'rtl' : 'ltr';
};

export const useTextDirection = (locale: AvailableLocale) => {
  const isRTL = isRTLLocale(locale);
  const direction = getTextDirection(locale);

  return {
    isRTL,
    direction,
  };
};
