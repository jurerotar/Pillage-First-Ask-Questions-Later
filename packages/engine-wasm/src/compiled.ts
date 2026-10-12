import './runtime-globals';
import { z } from 'zod';
import { type AdvanceResult, type EngineRequest, execute } from './core';
import { drainNotifications, setCaptureNotifications } from './notifications';
import { openDatabase } from './sqlite';

// Hermes has no runtime JavaScript compiler; use Zod's interpreted parsers.
z.config({ jitless: true });
const database = openDatabase('/world.sqlite3');
(globalThis as unknown as { enginePump: () => void }).enginePump = () => {
  try {
    const request = JSON.parse(engineNative.request()) as EngineRequest & {
      notifications?: boolean;
    };
    setCaptureNotifications(request.notifications !== false);
    const data = execute(database, request);
    // Scheduler batches already queried their next deadline in execute().
    const nextDeadline =
      request.type === 'advance'
        ? (data as AdvanceResult).nextDeadline
        : database.selectValue({
            sql: 'SELECT MIN(resolves_at) FROM events',
            schema: z.number().nullable(),
          });
    engineNative.respond(
      JSON.stringify({
        data,
        notifications: drainNotifications(),
        nextDeadline,
      }),
    );
  } catch (error) {
    drainNotifications();
    engineNative.respond(
      JSON.stringify({ error: String(error), stack: (error as Error).stack }),
    );
  }
};
