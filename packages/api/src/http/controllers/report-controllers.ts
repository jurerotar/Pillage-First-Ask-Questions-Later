import { z } from 'zod';
import {
  baseReportDtoSchema,
  reportDtoSchema,
} from '@pillage-first/types/dtos/report';
import {
  selectReportByIdQuery,
  selectReportsByPlayerQuery,
} from '../../queries/report-queries';
import { createController } from '../controller';
import { mapReport, mapReports } from './mappers/reports-mapper';
import { getReportsRowSchema } from './schemas/report-schemas';

export const getMyReports = createController('/reports/:playerId', {
  summary: 'Get my reports',
  requestParams: {
    path: z.strictObject({
      playerId: z.coerce.number(),
    }),
  },
  response: z.array(baseReportDtoSchema),
})(({ database, path: { playerId } }) => {
  const rows = database.selectObjects({
    sql: selectReportsByPlayerQuery,
    bind: { $player_id: playerId },
    schema: getReportsRowSchema,
  });

  return rows.map(mapReports);
});

export const getReport = createController('/report/:reportId', {
  summary: 'Get report by id',
  requestParams: {
    path: z.strictObject({
      reportId: z.coerce.number(),
    }),
  },
  response: reportDtoSchema.nullable(),
})(({ database, path: { reportId } }) => {
  const row = database.selectObject({
    sql: selectReportByIdQuery,
    bind: { $report_id: reportId },
    schema: getReportsRowSchema,
  });

  if (row) {
    return mapReport(database, row);
  }

  return null;
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
