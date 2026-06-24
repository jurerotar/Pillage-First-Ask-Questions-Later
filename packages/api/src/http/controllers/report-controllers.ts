import { z } from 'zod';
import {
  baseReportDtoSchema,
  reportDtoSchema,
} from '@pillage-first/types/dtos/report';
import {
  deleteReportQuery,
  getUnreadReportCountQuery,
  selectReportByIdQuery,
  selectReportsByPlayerQuery,
  updateReportQuery,
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

export const getUnreadReportCount = createController(
  '/reports/:playerId/unread-count',
  {
    summary: 'Get unread reports count',
    requestParams: {
      path: z.strictObject({
        playerId: z.coerce.number(),
      }),
    },
    response: z.int(),
  },
)(({ database, path: { playerId } }) => {
  return database.selectValue({
    sql: getUnreadReportCountQuery,
    bind: {
      $player_id: playerId,
    },
    schema: z.int(),
  });
});

export const updateReports = createController('/reports', 'patch', {
  summary: 'Update reports',
  requestBody: z.strictObject({
    reportIds: z.array(z.int()),
    isRead: z.boolean().optional(),
    isArchived: z.boolean().optional(),
    // TODO: Deal with tags
    tag: z.enum(['read', 'archived']).optional(),
  }),
})(({ database, body: { reportIds, isRead, isArchived } }) => {
  for (const reportId of reportIds) {
    database.exec({
      sql: updateReportQuery,
      bind: {
        $report_id: reportId,
        $is_read: isRead,
        $is_archived: isArchived,
      },
    });
  }
});

export const deleteReports = createController('/reports', 'delete', {
  summary: 'Delete report',
  requestBody: z.array(z.number()),
})(({ database, body }) => {
  for (const reportId of body) {
    database.exec({
      sql: deleteReportQuery,
      bind: {
        $report_id: reportId,
      },
    });
  }
});
