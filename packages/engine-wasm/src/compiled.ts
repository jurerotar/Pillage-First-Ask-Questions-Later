import './polyfills';
import { z } from 'zod';
import { advance, execute } from './core';
import { drainNotifications, setCaptureNotifications } from './notifications';
import { databasePath, parseRequest } from './protocol';
import { openDatabase } from './sqlite';

// Hermes has no runtime JavaScript compiler; use Zod's interpreted parsers.
z.config({ jitless: true });
const database = openDatabase(databasePath);
globalThis.enginePump = () => {
  try {
    const request = parseRequest(engineNative.request());
    setCaptureNotifications(request.notifications !== false);
    let data: unknown;
    let nextDeadline: number | null;
    if (request.type === 'advance') {
      const result = advance(database, request);
      data = result;
      nextDeadline = result.nextDeadline;
    } else {
      data = execute(database, request);
      nextDeadline =
        database.selectValue({
          sql: 'SELECT MIN(resolves_at) FROM events',
          schema: z.number().nullable(),
        }) ?? null;
    }
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
      JSON.stringify({
        error: String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }),
    );
  }
};
