import { z } from 'zod';
import { reportDtoSchema } from '@pillage-first/types/dtos/report';
import { selectReportsQuery } from '../../queries/report-queries';
import { createController } from '../controller';
import { mapReports } from './mappers/reports-mapper';
import { getReportSchema } from './schemas/report-schemas';

export const getMyReports = createController('/reports', {
  summary: 'Get my reports',
  response: z.array(reportDtoSchema),
})(({ database }) => {
  const rows = database.selectObjects({
    sql: selectReportsQuery,
    schema: getReportSchema,
  });

  return rows.map(mapReports);
});

// TODO: implement
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

// TODO: implement
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

// TODO: implement
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
