import { z } from 'zod';
import {
  createSchedulerDataSource,
  matchRoute,
} from '@pillage-first/api/runtime';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import type { AdvanceRequest, EngineRequest } from './protocol';

export type { EngineRequest } from './protocol';

export type AdvanceResult = {
  processed: number;
  nextDeadline: number | null;
};

export const execute = (
  database: DbFacade,
  request: EngineRequest,
): unknown => {
  if (request.type === 'request') {
    const route = matchRoute(request.url, request.method, request.body);
    return route.controller(database, {
      path: route.path,
      query: route.query,
      body: route.body,
      url: route.url,
    });
  }
  return advance(database, request);
};

export const advance = (
  database: DbFacade,
  request: AdvanceRequest,
): AdvanceResult => {
  const scheduler = createSchedulerDataSource(database);
  const ids = scheduler
    .getPastEventIds(request.now)
    .slice(0, request.limit ?? 1000);
  for (const id of ids) {
    scheduler.resolveEvent(id);
  }
  return {
    processed: ids.length,
    nextDeadline:
      database.selectValue({
        sql: 'SELECT MIN(resolves_at) FROM events',
        schema: z.number().nullable(),
      }) ?? null,
  };
};
