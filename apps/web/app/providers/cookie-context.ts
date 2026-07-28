import { createContext } from 'react';
import type {
  SkinVariant,
  TimeOfDay,
  UIColorScheme,
} from '@pillage-first/types/models/preferences';
import type { AvailableLocale } from 'app/localization/i18n';

export type CookieContextType = {
  locale: AvailableLocale;
  skinVariant: SkinVariant;
  timeOfDay: TimeOfDay;
  uiColorScheme: UIColorScheme;
};

export const CookieContext = createContext<CookieContextType>({} as never);
