import { useSyncExternalStore } from 'react';

let permission: NotificationPermission =
  typeof window !== 'undefined' &&
  'Notification' in window &&
  typeof Notification.requestPermission === 'function'
    ? Notification.permission
    : 'default';

const listeners = new Set<() => void>();

const subscribe = (callback: () => void) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

const getSnapshot = () => permission;

export const requestNotificationPermission = () => {
  return Notification.requestPermission().then((newPermission) => {
    if (newPermission !== permission) {
      permission = newPermission;
      listeners.forEach((cb) => cb());
    }
    return newPermission;
  });
};

export const useNotificationPermission = () => {
  return useSyncExternalStore(subscribe, getSnapshot);
};
