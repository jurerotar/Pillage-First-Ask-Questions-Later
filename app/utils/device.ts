export const isStandaloneDisplayMode = () => {
  return window.matchMedia('(display-mode: standalone)').matches;
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
