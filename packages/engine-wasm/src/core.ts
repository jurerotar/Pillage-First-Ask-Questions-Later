import { z } from 'zod';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { createSchedulerDataSource } from '../../api/src/http/events/scheduler/scheduler-data-source';
import { matchRoute } from '../../api/src/http/route-matcher';

export type EngineRequest =
  | { type: 'request'; url: string; method: string; body?: unknown }
  | { type: 'advance'; now: number; limit?: number };

export function execute(database: DbFacade, request: EngineRequest): unknown {
  if (request.type === 'request') {
    const route = matchRoute(request.url, request.method, request.body);
    return route.controller(database, {
      path: route.path,
      query: route.query,
      body: route.body as never,
      url: route.url,
    });
  }
  const scheduler = createSchedulerDataSource(database);
  const ids = scheduler
    .getPastEventIds(request.now)
    .slice(0, request.limit ?? 1000);
  for (const id of ids) {
    scheduler.resolveEvent(id);
  }
  return {
    processed: ids.length,
    nextDeadline: database.selectValue({
      sql: 'SELECT MIN(resolves_at) FROM events',
      schema: z.number().nullable(),
    }),
  };
}
