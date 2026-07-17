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
    r.type,
    cri.combat_result AS combat_result_id,
    b.is_raid AS battle_is_raid,
    origin_v.name AS battle_origin_name,
    CASE
      WHEN target_v.id IS NOT NULL THEN target_v.name
      WHEN target_o.id IS NOT NULL AND target_o.village_id IS NOT NULL THEN 'Occupied oasis'
      WHEN target_o.id IS NOT NULL THEN 'Unoccupied oasis'
      ELSE ''
      END AS battle_target_name,
    target_t.x AS battle_target_x,
    target_t.y AS battle_target_y,
    tag
  FROM
    reports r
    LEFT JOIN battles b ON r.id = b.report_id
    LEFT JOIN tiles origin_t ON b.origin_tile_id = origin_t.id
    LEFT JOIN villages origin_v ON origin_t.id = origin_v.tile_id
    LEFT JOIN tiles target_t ON b.target_tile_id = target_t.id
    LEFT JOIN villages target_v ON target_t.id = target_v.tile_id
    LEFT JOIN oasis target_o ON target_t.id = target_o.tile_id
    LEFT JOIN combat_result_ids cri ON r.combat_result_id = cri.id
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
