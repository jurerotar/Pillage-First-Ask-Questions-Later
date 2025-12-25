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
} from 'app/interfaces/models/game/preferences';
import type { AvailableLocale } from 'app/interfaces/models/locale';
import {
  GRAPHICS_SKIN_VARIANT_COOKIE_NAME,
  GRAPHICS_TIME_OF_DAY_COOKIE_NAME,
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
    const cookieStore = window.cookieStore;

    const updateCookies = async () => {
      const allCookies = await cookieStore.getAll();

      const nextCookies: CookieContextType = {
        locale: 'en-US',
        skinVariant: 'default',
        timeOfDay: 'day',
        uiColorScheme: 'light',
      };

      for (const c of allCookies) {
        switch (c.name) {
          case LOCALE_COOKIE_NAME: {
            nextCookies.locale = c.value as AvailableLocale;
            break;
          }
          case GRAPHICS_SKIN_VARIANT_COOKIE_NAME: {
            nextCookies.skinVariant = c.value as SkinVariant;
            break;
          }
          case GRAPHICS_TIME_OF_DAY_COOKIE_NAME: {
            nextCookies.timeOfDay = c.value as TimeOfDay;
            break;
          }
          case UI_COLOR_SCHEME_COOKIE_NAME: {
            nextCookies.uiColorScheme = c.value as UIColorScheme;
            break;
          }
        }
      }

      setCookies(nextCookies);
    };

    updateCookies();

    cookieStore.addEventListener('change', updateCookies);

    return () => {
      cookieStore.removeEventListener('change', updateCookies);
    };
  }, []);

  return (
    <CookieContext.Provider value={cookies}>{children}</CookieContext.Provider>
  );
};
