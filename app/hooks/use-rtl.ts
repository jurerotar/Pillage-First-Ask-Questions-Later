import { useTranslation } from 'react-i18next';
import type { AvailableLocale } from 'app/interfaces/models/locale';
import { isRTLLocale, getTextDirection, getDirectionClass } from 'app/utils/rtl';

/**
 * Hook to detect and manage RTL (Right-to-Left) text direction
 * @returns Object containing RTL detection utilities and current locale info
 */
export const useRTL = () => {
  const { i18n } = useTranslation();
  const currentLocale = i18n.language as AvailableLocale;

  const isRTL = isRTLLocale(currentLocale);
  const direction = getTextDirection(currentLocale);
  const directionClass = getDirectionClass(currentLocale);

  return {
    isRTL,
    direction,
    directionClass,
    currentLocale,
  };
};
