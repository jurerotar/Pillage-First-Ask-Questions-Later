import { startTransition, StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { HydratedRouter } from 'react-router/dom';
import { I18nextProvider } from 'react-i18next';
import { i18n } from 'app/localization/i18n';
import {
  LOCALE_COOKIE_NAME,
  setCookie,
  GRAPHICS_SKIN_VARIANT_COOKIE_NAME,
  GRAPHICS_TIME_OF_DAY_COOKIE_NAME,
  UI_COLOR_SCHEME_COOKIE_NAME,
} from 'app/utils/device';
import type { AvailableLocale } from 'app/interfaces/models/locale';
import type {
  SkinVariant,
  TimeOfDay,
  UIColorScheme,
} from 'app/interfaces/models/game/preferences';
import { CookieProvider } from 'app/providers/cookie-provider';

const createCookies = async () => {
  const cookieStore = window.cookieStore;

  if ((await cookieStore.get(LOCALE_COOKIE_NAME)) === null) {
    await setCookie<AvailableLocale>(LOCALE_COOKIE_NAME, 'en-US');
  }

  if ((await cookieStore.get(GRAPHICS_SKIN_VARIANT_COOKIE_NAME)) === null) {
    await setCookie<SkinVariant>(GRAPHICS_SKIN_VARIANT_COOKIE_NAME, 'default');
  }

  if ((await cookieStore.get(UI_COLOR_SCHEME_COOKIE_NAME)) === null) {
    await setCookie<UIColorScheme>(UI_COLOR_SCHEME_COOKIE_NAME, 'light');
  }

  if ((await cookieStore.get(GRAPHICS_TIME_OF_DAY_COOKIE_NAME)) === null) {
    await setCookie<TimeOfDay>(GRAPHICS_TIME_OF_DAY_COOKIE_NAME, 'day');
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
