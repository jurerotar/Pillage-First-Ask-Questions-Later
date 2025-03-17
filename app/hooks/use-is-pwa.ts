export const useIsPwa = () => {
  return window.matchMedia('(display-mode: standalone)').matches;
};
