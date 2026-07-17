import { z } from 'zod';
import {
  baseReportDtoSchema,
  reportDtoSchema,
} from '@pillage-first/types/dtos/report';
import {
  reportTagSchema,
  reportTypeSchema,
} from '@pillage-first/types/models/report';
import {
  deleteReportQuery,
  deleteReportTagQuery,
  insertReportTagQuery,
  selectReportQuery,
  selectReportsQuery,
} from '../../queries/report-queries';
import { createController } from '../controller';
import { mapReport, mapReports } from './mappers/reports-mapper';
import { getReportsRowSchema } from './schemas/report-schemas';

export const getReports = createController(
  '/players/:playerId/reports/:villageId',
  {
    summary: 'Get player reports',
    requestParams: {
      path: z.strictObject({
        playerId: z.coerce.number(),
        villageId: z.coerce.number(),
      }),
      query: z.strictObject({
        scope: z
          .enum(['global', 'unread', 'archived', 'village'])
          .optional()
          .default('global'),
        types: z.array(reportTypeSchema).or(reportTypeSchema).optional(),
      }),
    },
    response: z.array(baseReportDtoSchema),
  },
)(({ database, path: { playerId, villageId }, query }) => {
  const scope = query.scope ?? 'global';
  const reportTypes =
    query.types == null
      ? []
      : Array.isArray(query.types)
        ? query.types
        : [query.types];
  const rows = database.selectObjects({
    sql: selectReportsQuery,
    bind: {
      $player_id: playerId,
      $village_id: villageId,
      $scope: scope,
      $type_count: reportTypes.length,
      $include_battle: reportTypes.includes('battle') ? 1 : 0,
      $include_adventure: reportTypes.includes('adventure') ? 1 : 0,
      $include_trade: reportTypes.includes('trade') ? 1 : 0,
    },
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
