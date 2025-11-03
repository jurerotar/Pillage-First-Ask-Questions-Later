export const isStandaloneDisplayMode = () => {
  return window.matchMedia('(display-mode: standalone)').matches;
};

/**
 * Returns true for Safari *and* for any browser on iOS/iPadOS that uses WebKit.
 * (This intentionally treats Chrome/Fx/Edge on iOS as "Safari" because they run on WebKit.)
 */
export const isSafariOrIOs = (): boolean => {
  if (typeof navigator === 'undefined') {
    return false;
  }
  const ua = navigator.userAgent || '';
  const isiDeviceByUA = /iP(hone|od|ad)/.test(ua);
  const isiPadOS =
    navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  const isAppleDevice = isiDeviceByUA || isiPadOS;

  if (!isAppleDevice) {
    return false;
  }

  // If the UA indicates AppleWebKit, it's running on the Safari/WebKit engine.
  if (/AppleWebKit/i.test(ua)) {
    return true;
  }

  // Fallback: explicit Safari token (covers some edge UAs)
  if (/Safari/i.test(ua)) {
    return true;
  }

  return false;
};

export const _getCookie = async (
  name: string,
  fallback: string,
): Promise<string> => {
  const cookie = await cookieStore.get(name);
  return cookie?.value ?? fallback;
};

export const _setCookie = async (
  name: string,
  value: string,
  days = 365,
): Promise<void> => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

  await cookieStore.set({
    name,
    value,
    expires: expires.getTime(),
    path: '/',
  });
};
