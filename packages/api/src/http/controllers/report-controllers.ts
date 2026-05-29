import { z } from 'zod';
import { createController } from '../controller';

export const getMyReports = createController('/players/:playerId/reports', {
  summary: 'Get my reports',
  requestParams: {
    path: z.strictObject({
      playerId: z.coerce.number(),
    }),
  },
  response: z.array(
    z.strictObject({
      id: z.string(),
      tags: z.array(z.enum(['read', 'archived'])),
      timestamp: z.number().int(),
      villageId: z.number().int(),
    }),
  ),
})(() => {
  return [];
});

export const getUnreadReportCount = createController(
  '/players/:playerId/reports/unread-count',
  {
    summary: 'Get unread reports count',
    requestParams: {
      path: z.strictObject({
        playerId: z.coerce.number(),
      }),
    },
    response: z.number().int(),
  },
)(() => {
  return 0;
});

export const updateReport = createController('/reports/:reportId', 'patch', {
  summary: 'Update report',
  requestParams: {
    path: z.strictObject({
      reportId: z.string(),
    }),
  },
  requestBody: z.strictObject({
    tag: z.enum(['read', 'archived']),
  }),
})(() => {
  // no-op for now
});

export const deleteReport = createController('/reports/:reportId', 'delete', {
  summary: 'Delete report',
  requestParams: {
    path: z.strictObject({
      reportId: z.string(),
    }),
  },
})(() => {
  // no-op for now
});
