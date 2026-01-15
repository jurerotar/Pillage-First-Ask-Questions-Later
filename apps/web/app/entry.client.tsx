import { StrictMode, startTransition } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { HydratedRouter } from 'react-router/dom';
import type {
  SkinVariant,
  TimeOfDay,
  UIColorScheme,
} from '@pillage-first/types/models/preferences';
import type { AvailableLocale } from 'app/localization/i18n';
import { i18n } from 'app/localization/i18n';
import { CookieProvider } from 'app/providers/cookie-provider';
import {
  GRAPHICS_SKIN_VARIANT_COOKIE_NAME,
  GRAPHICS_TIME_OF_DAY_COOKIE_NAME,
  getCookie,
  LOCALE_COOKIE_NAME,
  setCookie,
  UI_COLOR_SCHEME_COOKIE_NAME,
} from 'app/utils/device';

const createCookies = async () => {
  const [locale, skinVariant, colorScheme, timeOfDay] = await Promise.all([
    getCookie(LOCALE_COOKIE_NAME),
    getCookie(GRAPHICS_SKIN_VARIANT_COOKIE_NAME),
    getCookie(UI_COLOR_SCHEME_COOKIE_NAME),
    getCookie(GRAPHICS_TIME_OF_DAY_COOKIE_NAME),
  ]);

  const setters: Promise<void>[] = [];

  if (locale === null) {
    setters.push(setCookie<AvailableLocale>(LOCALE_COOKIE_NAME, 'en-US'));
  }

  if (skinVariant === null) {
    setters.push(
      setCookie<SkinVariant>(GRAPHICS_SKIN_VARIANT_COOKIE_NAME, 'default'),
    );
  }

  if (colorScheme === null) {
    setters.push(
      setCookie<UIColorScheme>(UI_COLOR_SCHEME_COOKIE_NAME, 'light'),
    );
  }

  if (timeOfDay === null) {
    setters.push(setCookie<TimeOfDay>(GRAPHICS_TIME_OF_DAY_COOKIE_NAME, 'day'));
  }

  if (setters.length > 0) {
    await Promise.all(setters);
  }
};

if (typeof window !== 'undefined') {
  await createCookies();
}

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <CookieProvider>
        <I18nextProvider i18n={i18n}>
          <HydratedRouter />
        </I18nextProvider>
      </CookieProvider>
    </StrictMode>,
  );
});
