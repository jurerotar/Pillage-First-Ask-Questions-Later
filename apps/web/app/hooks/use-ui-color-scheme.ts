import { useSyncExternalStore } from 'react';
import {
  subscribeToCookieChanges,
  UI_COLOR_SCHEME_COOKIE_NAME,
} from 'app/utils/device';

export const uiColorSchemeCookiePattern = new RegExp(
  String.raw`(?:^|;\s*)${UI_COLOR_SCHEME_COOKIE_NAME}=([^;]*)`,
  'u',
);

const getColorScheme = () => {
  return uiColorSchemeCookiePattern.exec(document.cookie)?.[1] === 'dark'
    ? 'dark'
    : 'light';
};

// Hydrate against the class already applied by the inline script.
const getInitialColorScheme = () => {
  return typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark')
    ? 'dark'
    : 'light';
};

export const useUiColorScheme = () => {
  return useSyncExternalStore(
    subscribeToCookieChanges,
    getColorScheme,
    getInitialColorScheme,
  );
};
