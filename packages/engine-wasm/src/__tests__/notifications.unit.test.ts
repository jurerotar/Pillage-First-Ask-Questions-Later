import { beforeEach, expect, test } from 'vitest';
import { postWorkerMessage } from '../../../api/src/worker/notification-port';
import {
  drainNotifications,
  notificationCheckpoint,
  rollbackNotifications,
  setCaptureNotifications,
} from '../notifications';

beforeEach(() => {
  drainNotifications();
  setCaptureNotifications(false);
});

test('capture respects the API notification switch and force option', () => {
  postWorkerMessage('suppressed');
  postWorkerMessage('forced', { force: true });
  setCaptureNotifications(true);
  postWorkerMessage('enabled');
  setCaptureNotifications(false);
  postWorkerMessage('suppressed again');
  expect(drainNotifications()).toEqual(['forced', 'enabled']);
});

test('drain returns an independent batch and clears the next request', () => {
  setCaptureNotifications(true);
  postWorkerMessage({ id: 1 });
  const first = drainNotifications();
  postWorkerMessage({ id: 2 });
  expect(first).toEqual([{ id: 1 }]);
  expect(drainNotifications()).toEqual([{ id: 2 }]);
  expect(drainNotifications()).toEqual([]);
});

test('rollback removes only notifications emitted after its checkpoint', () => {
  setCaptureNotifications(true);
  postWorkerMessage('previous event');
  const checkpoint = notificationCheckpoint();
  postWorkerMessage('failed event');
  postWorkerMessage('forced failure', { force: true });
  rollbackNotifications(checkpoint);
  expect(drainNotifications()).toEqual(['previous event']);
});
