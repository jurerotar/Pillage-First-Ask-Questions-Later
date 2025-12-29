export const LOCALE_COOKIE_NAME = 'pillage-first-locale';
export const UI_COLOR_SCHEME_COOKIE_NAME = 'pillage-first-ui-color-scheme';
export const GRAPHICS_SKIN_VARIANT_COOKIE_NAME = 'pillage-first-skin-variant';
export const GRAPHICS_TIME_OF_DAY_COOKIE_NAME = 'pillage-first-time-of-day';

export const COOKIE_UPDATE_EVENT_NAME = 'pillage-first-cookies-update-event';

export const isStandaloneDisplayMode = () => {
  return window.matchMedia('(display-mode: standalone)').matches;
};

type CookieName =
  | typeof LOCALE_COOKIE_NAME
  | typeof GRAPHICS_SKIN_VARIANT_COOKIE_NAME
  | typeof UI_COLOR_SCHEME_COOKIE_NAME
  | typeof GRAPHICS_TIME_OF_DAY_COOKIE_NAME;

export const setCookie = async <T extends string>(
  name: CookieName,
  value: T,
): Promise<void> => {
  const expires = new Date();
  expires.setTime(expires.getTime() + 365 * 24 * 60 * 60 * 1000);

  if (window.cookieStore) {
    await window.cookieStore.set({
      name,
      value,
      expires: expires.getTime(),
      path: '/',
    });
    return;
  }

  document.cookie = `${name}=${value}; expires=${expires.toUTCString()}`;
  const event = new Event(COOKIE_UPDATE_EVENT_NAME);
  document.dispatchEvent(event);
};

export const getCookie = async (name: CookieName): Promise<string | null> => {
  if (window.cookieStore) {
    const cookie = await window.cookieStore.get(name);
    return cookie?.value || null;
  }

  const cookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith(name));
  return cookie?.split('=')[1] || null;
};
