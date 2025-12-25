export const LOCALE_COOKIE_NAME = 'pillage-first-locale';
export const UI_COLOR_SCHEME_COOKIE_NAME = 'pillage-first-ui-color-scheme';
export const GRAPHICS_SKIN_VARIANT_COOKIE_NAME = 'pillage-first-skin-variant';
export const GRAPHICS_TIME_OF_DAY_COOKIE_NAME = 'pillage-first-time-of-day';

export const isStandaloneDisplayMode = () => {
  return window.matchMedia('(display-mode: standalone)').matches;
};

export const setCookie = async <T extends string>(
  name:
    | typeof LOCALE_COOKIE_NAME
    | typeof GRAPHICS_SKIN_VARIANT_COOKIE_NAME
    | typeof UI_COLOR_SCHEME_COOKIE_NAME
    | typeof GRAPHICS_TIME_OF_DAY_COOKIE_NAME,
  value: T,
): Promise<void> => {
  const expires = new Date();
  expires.setTime(expires.getTime() + 365 * 24 * 60 * 60 * 1000);

  await cookieStore.set({
    name,
    value,
    expires: expires.getTime(),
    path: '/',
  });
};
