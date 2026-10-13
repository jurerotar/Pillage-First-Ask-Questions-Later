export type NotificationPort = Pick<MessagePort, 'start' | 'postMessage'>;

let notificationPort: NotificationPort | null = null;
let shouldPostNotifications = false;

export const setNotificationPort = (port: NotificationPort): void => {
  notificationPort = port;
  notificationPort.start();
};

export const setShouldPostNotifications = (value: boolean): void => {
  shouldPostNotifications = value;
};

export const postWorkerMessage = (
  message: unknown,
  options?: { force?: boolean },
): void => {
  if (!notificationPort) {
    return;
  }

  if (!options?.force && !shouldPostNotifications) {
    return;
  }

  notificationPort.postMessage(message);
};
