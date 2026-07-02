import { z } from 'zod';
import {
  baseReportDtoSchema,
  reportDtoSchema,
} from '@pillage-first/types/dtos/report';
import { reportTagSchema } from '@pillage-first/types/models/report';
import {
  deleteReportQuery,
  deleteReportTagQuery,
  insertReportTagQuery,
  selectReportQuery,
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
        types: z
          .array(z.enum(['battle', 'adventure', 'trade']))
          .or(z.enum(['battle', 'adventure', 'trade']))
          .optional(),
      }),
    },
    response: z.array(baseReportDtoSchema),
  },
)(({ database, path: { playerId, villageId }, url }) => {
  const { searchParams } = new URL(url, 'http://localhost');
  const scope = searchParams.get('scope') ?? 'global';
  const types = searchParams.getAll('types');

  const isArchivedFilter = `
  EXISTS (
    SELECT
      1
    FROM
      report_tags rt
      JOIN report_tag_ids rti ON rt.report_tag_id = rti.id
    WHERE
      rt.report_id = r.id
      AND rti.tag = 'ARCHIVED'
  )`;
  const isUnreadFilter = `
  NOT EXISTS (
    SELECT
      1
    FROM
      report_tags rt
      JOIN report_tag_ids rti ON rt.report_tag_id = rti.id
    WHERE
      rt.report_id = r.id
      AND rti.tag = 'READ'
  )`;
  const scopeFilter =
    scope === 'village'
      ? 'WHERE r.player_id = $player_id AND r.village_id = $village_id'
      : scope === 'unread'
        ? `WHERE r.player_id = $player_id AND ${isUnreadFilter}`
        : scope === 'archived'
          ? `WHERE r.player_id = $player_id AND ${isArchivedFilter}`
          : 'WHERE r.player_id = $player_id';

  var typeFilter = '';
  if (types != null && types.length > 0) {
    typeFilter = `AND r.type in (${types.map((t) => `'${t}'`).join(', ')})`;
  }

  const selectReportsQuery = `
  SELECT
    r.id,
    r.player_id,
    r.village_id,
    r.timestamp,
    r.subject,
    r.type,
    tag
  FROM
    reports r
    LEFT JOIN report_tags t ON r.id = t.report_id
    LEFT JOIN report_tag_ids i ON t.report_tag_id = i.id
  ${scopeFilter}
  ${typeFilter}
  ORDER BY
    timestamp DESC;`;

  const bind =
    scope === 'village'
      ? { $player_id: playerId, $village_id: villageId }
      : { $player_id: playerId };

  const rows = database.selectObjects({
    sql: selectReportsQuery,
    bind,
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
