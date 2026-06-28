import { z } from 'zod';
import {
  baseReportDtoSchema,
  reportDtoSchema,
} from '@pillage-first/types/dtos/report';
import { reportTagSchema } from '@pillage-first/types/models/report';
import {
  deleteReportQuery,
  deleteReportTagQuery,
  getUnreadReportCountQuery,
  insertReportTagQuery,
  selectReportQuery,
  selectReportsQuery,
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
    sql: selectReportsQuery,
    bind: { $player_id: playerId },
    schema: getReportsRowSchema,
  });

  return mapReports(rows);
});

export const getReport = createController('/report/:playerId/:reportId', {
  summary: 'Get report by id',
  requestParams: {
    path: z.strictObject({
      playerId: z.coerce.number(),
      reportId: z.coerce.number(),
    }),
  },
  response: reportDtoSchema.nullable(),
})(({ database, path: { playerId, reportId } }) => {
  const rows = database.selectObjects({
    sql: selectReportQuery,
    bind: { $player_id: playerId, $report_id: reportId },
    schema: getReportsRowSchema,
  });

  if (rows.length > 0) {
    return mapReport(database, rows);
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
    addTags: z.array(reportTagSchema).optional(),
    removeTags: z.array(reportTagSchema).optional(),
  }),
})(({ database, body: { reportIds, addTags, removeTags } }) => {
  for (const reportId of reportIds) {
    if (addTags) {
      for (const tag of addTags) {
        database.exec({
          sql: insertReportTagQuery,
          bind: {
            $report_id: reportId,
            $tag: tag,
          },
        });
      }
    }

    if (removeTags) {
      for (const tag of removeTags) {
        database.exec({
          sql: deleteReportTagQuery,
          bind: {
            $report_id: reportId,
            $tag: tag,
          },
        });
      }
    }
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
