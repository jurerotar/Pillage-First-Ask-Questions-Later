import { useSyncExternalStore } from 'react';

let permission: NotificationPermission | 'not-available' =
  typeof window === 'undefined' ||
  !('Notification' in window) ||
  typeof Notification.requestPermission !== 'function'
    ? 'not-available'
    : window.Notification.permission;

const listeners = new Set<() => void>();

const subscribe = (callback: () => void) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

const getSnapshot = () => permission;

export const requestNotificationPermission = async () => {
  const newPermission = await window.Notification.requestPermission();
  if (newPermission !== permission) {
    permission = newPermission;
    listeners.forEach((cb) => cb());
  }
  return newPermission;
};

export const useNotificationPermission = () => {
  return useSyncExternalStore(subscribe, getSnapshot);
};
