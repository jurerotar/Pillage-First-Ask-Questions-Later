// Host-independent API entry points for alternate runtimes.
export { createSchedulerDataSource } from './http/events/scheduler/scheduler-data-source';
export { matchRoute } from './http/route-matcher';
export {
  postWorkerMessage,
  setNotificationPort,
  setShouldPostNotifications,
} from './worker/notification-port';
