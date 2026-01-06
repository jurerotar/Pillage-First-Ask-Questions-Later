import {
  createContext,
  type PropsWithChildren,
  useEffect,
  useState,
} from 'react';
import type {
  SkinVariant,
  TimeOfDay,
  UIColorScheme,
} from '@pillage-first/types/models/preferences';
import type { AvailableLocale } from 'app/localization/i18n';
import {
  COOKIE_UPDATE_EVENT_NAME,
  GRAPHICS_SKIN_VARIANT_COOKIE_NAME,
  GRAPHICS_TIME_OF_DAY_COOKIE_NAME,
  getCookie,
  LOCALE_COOKIE_NAME,
  UI_COLOR_SCHEME_COOKIE_NAME,
} from 'app/utils/device';

type CookieContextType = {
  locale: AvailableLocale;
  skinVariant: SkinVariant;
  timeOfDay: TimeOfDay;
  uiColorScheme: UIColorScheme;
};

export const CookieContext = createContext<CookieContextType>({} as never);

export const CookieProvider = ({ children }: PropsWithChildren) => {
  const [cookies, setCookies] = useState<CookieContextType>({
    locale: 'en-US',
    skinVariant: 'default',
    timeOfDay: 'day',
    uiColorScheme: 'light',
  });

  useEffect(() => {
    const updateCookies = async () => {
      const nextCookies: CookieContextType = {
        locale: 'en-US',
        skinVariant: 'default',
        timeOfDay: 'day',
        uiColorScheme: 'light',
      };

      const allCookies: Record<keyof CookieContextType, string | null> = {
        locale: await getCookie(LOCALE_COOKIE_NAME),
        skinVariant: await getCookie(GRAPHICS_SKIN_VARIANT_COOKIE_NAME),
        timeOfDay: await getCookie(GRAPHICS_TIME_OF_DAY_COOKIE_NAME),
        uiColorScheme: await getCookie(UI_COLOR_SCHEME_COOKIE_NAME),
      };

      if (allCookies.locale) {
        nextCookies.locale = allCookies.locale as AvailableLocale;
      }
      if (allCookies.skinVariant) {
        nextCookies.skinVariant = allCookies.skinVariant as SkinVariant;
      }
      if (allCookies.timeOfDay) {
        nextCookies.timeOfDay = allCookies.timeOfDay as TimeOfDay;
      }
      if (allCookies.uiColorScheme) {
        nextCookies.uiColorScheme = allCookies.uiColorScheme as UIColorScheme;
      }

      setCookies(nextCookies);
    };

    updateCookies();

    const cookieStore = window.cookieStore;

    if (cookieStore) {
      cookieStore.addEventListener('change', updateCookies);
    } else {
      document.addEventListener(COOKIE_UPDATE_EVENT_NAME, updateCookies);
    }

    return () => {
      if (cookieStore) {
        cookieStore.removeEventListener('change', updateCookies);
      } else {
        document.removeEventListener(COOKIE_UPDATE_EVENT_NAME, updateCookies);
      }
    };
  }, []);

  return (
    <CookieContext.Provider value={cookies}>{children}</CookieContext.Provider>
  );
};
