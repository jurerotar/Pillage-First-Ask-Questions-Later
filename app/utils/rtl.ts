import type { AvailableLocale } from 'app/interfaces/models/locale';

/**
 * List of RTL (Right-to-Left) language codes
 */
const RTL_LANGUAGES = ['ar', 'ar-SA', 'he', 'fa', 'ur'] as const;

/**
 * Checks if a given locale is a Right-to-Left language
 * @param locale - The locale to check
 * @returns true if the locale is RTL, false otherwise
 */
export const isRTLLocale = (locale: AvailableLocale): boolean => {
  // Check if the locale starts with any RTL language code
  return RTL_LANGUAGES.some(rtlLang => locale.startsWith(rtlLang));
};

/**
 * Gets the text direction for a given locale
 * @param locale - The locale to check
 * @returns 'rtl' for RTL languages, 'ltr' for LTR languages
 */
export const getTextDirection = (locale: AvailableLocale): 'rtl' | 'ltr' => {
  return isRTLLocale(locale) ? 'rtl' : 'ltr';
};

/**
 * Gets the appropriate CSS class for text direction
 * @param locale - The locale to check
 * @returns CSS class name for the text direction
 */
export const getDirectionClass = (locale: AvailableLocale): string => {
  return isRTLLocale(locale) ? 'rtl' : 'ltr';
};
