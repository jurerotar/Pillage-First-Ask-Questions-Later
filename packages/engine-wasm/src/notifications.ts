import {
  setNotificationPort,
  setShouldPostNotifications,
} from '../../api/src/worker/notification-port';

// Connect the API's existing notification port to the Wasm response envelope.
// Transaction rollback discards notifications emitted by failed events.
let pending: unknown[] = [];
setNotificationPort({
  start() {},
  postMessage(message: unknown) {
    pending.push(message);
  },
} as MessagePort);
export const setCaptureNotifications = (value: boolean) =>
  setShouldPostNotifications(value);
export const drainNotifications = () => {
  const messages = pending;
  pending = [];
  return messages;
};
export const notificationCheckpoint = () => pending.length;
export const rollbackNotifications = (checkpoint: number) => {
  pending.length = checkpoint;
};
