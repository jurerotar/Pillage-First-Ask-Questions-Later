import type {
  ApiNotificationEvent,
  ControllerErrorEvent,
  DatabaseInitializationErrorEvent,
} from '@pillage-first/types/api-events';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import {
  cancelScheduling,
  initScheduler,
  scheduleNextEvent,
} from '../http/events/scheduler/scheduler';
import { createSchedulerDataSource } from '../http/events/scheduler/scheduler-data-source';
import { matchRoute } from '../http/route-matcher';
import { closeWorkerDatabase, openWorkerDatabase } from './database';
import {
  postWorkerMessage,
  setNotificationPort,
  setShouldPostNotifications,
} from './notification-port';

let dbFacade: DbFacade | null = null;

const getInitializedDatabase = (): DbFacade => {
  if (dbFacade === null) {
    throw new Error('API worker database is not initialized');
  }

  return dbFacade;
};

globalThis.addEventListener('message', async (event: MessageEvent) => {
  const { data } = event;
  const { type } = data;

  switch (type) {
    case 'WORKER_INIT': {
      try {
        const [port] = event.ports;

        if (!port) {
          throw new Error('Missing notification port during worker init');
        }

        setNotificationPort(port);

        const urlParams = new URLSearchParams(globalThis.location.search);
        const serverSlug = urlParams.get('server-slug');

        if (!serverSlug) {
          throw new Error('Missing server slug during worker init');
        }

        dbFacade = await openWorkerDatabase(serverSlug);

        const dataSource = createSchedulerDataSource(dbFacade);

        initScheduler(dataSource);
        scheduleNextEvent(dataSource);

        postWorkerMessage(
          {
            eventKey: 'event:database-initialization-success',
          } satisfies ApiNotificationEvent,
          { force: true },
        );
        break;
      } catch (error) {
        postWorkerMessage(
          {
            eventKey: 'event:database-initialization-error',
            error: error as Error,
          } satisfies DatabaseInitializationErrorEvent,
          { force: true },
        );
        break;
      }
    }
    case 'WORKER_START_NOTIFICATION_POSTING': {
      setShouldPostNotifications(true);
      break;
    }
    case 'WORKER_STOP_NOTIFICATION_POSTING': {
      setShouldPostNotifications(false);
      break;
    }
    case 'WORKER_MESSAGE': {
      const { data, ports } = event;

      const [port] = ports;
      const { url, method, body } = data;

      try {
        const database = getInitializedDatabase();
        const {
          controller,
          path,
          query,
          body: parsedBody,
          url: rawUrl,
        } = matchRoute(url, method, body);
        const result = controller(database, {
          path,
          query,
          body: parsedBody as never,
          url: rawUrl,
        });

        port.postMessage({
          data: result,
        });

        break;
      } catch (error) {
        console.error(error);
        const errorEvent = {
          eventKey: 'event:error',
          error: error as Error,
        } satisfies ControllerErrorEvent;

        port.postMessage(errorEvent);
        postWorkerMessage(errorEvent);
        break;
      }
    }
    case 'WORKER_CLOSE': {
      setShouldPostNotifications(false);
      cancelScheduling();

      if (dbFacade !== null) {
        closeWorkerDatabase(dbFacade);
      }

      dbFacade = null;

      postWorkerMessage({ type: 'WORKER_CLOSE_SUCCESS' }, { force: true });
      break;
    }
  }
});
