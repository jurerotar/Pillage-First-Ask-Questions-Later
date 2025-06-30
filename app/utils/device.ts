export const isStandaloneDisplayMode = () => {
  return window.matchMedia('(display-mode: standalone)').matches;
};

export const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
};
