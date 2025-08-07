export const isStandaloneDisplayMode = () => {
  return window.matchMedia('(display-mode: standalone)').matches;
};

export const getCookie = async (name: string): Promise<string | null> => {
  const cookie = await cookieStore.get(name);
  return cookie?.value ?? null;
};

export const setCookie = async (
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
