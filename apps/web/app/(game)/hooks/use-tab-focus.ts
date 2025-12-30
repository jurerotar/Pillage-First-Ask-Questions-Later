import { useSyncExternalStore } from 'react';

const subscribe = (callback: () => void) => {
  const handleVisibilityChange = () => callback();
  const handleFocus = () => callback();
  const handleBlur = () => callback();

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('focus', handleFocus);
  window.addEventListener('blur', handleBlur);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleFocus);
    window.removeEventListener('blur', handleBlur);
  };
};

const getSnapshot = () => {
  return !document.hidden && document.hasFocus();
};

export const useTabFocus = () => {
  return useSyncExternalStore(subscribe, getSnapshot);
};
