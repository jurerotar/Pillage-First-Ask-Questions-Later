import { z } from 'zod';
import { reportListingDtoSchema } from '@pillage-first/types/dtos/report';
import {
  reportSchema,
  reportTagSchema,
  reportTypeSchema,
} from '@pillage-first/types/models/report';
import { unitIdSchema } from '@pillage-first/types/models/unit';
import {
  deleteReportQuery,
  deleteReportTagQuery,
  insertReportTagQuery,
  selectAdventureReportQuery,
  selectBattleReportQuery,
  selectMovementReportQuery,
  selectReportListingsQuery,
  selectReportTypeQuery,
  selectTradeReportQuery,
} from '../../queries/report-queries';
import { createController } from '../controller';
import {
  mapAdventureReportRowToDto,
  mapBattleReportRowToDto,
  mapMovementReportRowToDto,
  mapReportListingRowToDto,
  mapTradeReportRowToDto,
} from './mappers/report-mapper';
import {
  adventureReportRowSchema,
  battleReportRowSchema,
  getReportListingsRowSchema,
  getReportTypeRowSchema,
  movementReportRowSchema,
  tradeReportRowSchema,
} from './schemas/report-schemas';

export const getReports = createController('/players/:playerId/reports', {
  summary: 'Get player reports',
  requestParams: {
    path: z.strictObject({
      playerId: z.coerce.number(),
    }),
    query: z.strictObject({
      scope: z
        .enum(['global', 'unread', 'archived', 'village'])
        .optional()
        .default('global'),
      villageId: z.coerce.number().optional(),
      types: z.array(reportTypeSchema).or(reportTypeSchema).optional(),
    }),
  },
  response: z.array(reportListingDtoSchema),
})(({ database, path: { playerId }, query }) => {
  const scope = query.scope ?? 'global';
  const reportTypes =
    query.types == null
      ? []
      : Array.isArray(query.types)
        ? query.types
        : [query.types];

  const rows = database.selectObjects({
    sql: selectReportListingsQuery,
    bind: {
      $player_id: playerId,
      $village_id: query.villageId ?? null,
      $scope: scope,
      $type_count: reportTypes.length,
      $include_battle: reportTypes.includes('battle') ? 1 : 0,
      $include_adventure: reportTypes.includes('adventure') ? 1 : 0,
      $include_trade: reportTypes.includes('trade') ? 1 : 0,
      $include_movement: reportTypes.includes('movement') ? 1 : 0,
    },
    schema: getReportListingsRowSchema,
  });

  return rows.map(mapReportListingRowToDto);
});

export const getReport = createController('/report/:playerId/:reportId', {
  summary: 'Get report by id',
  requestParams: {
    path: z.strictObject({
      playerId: z.coerce.number(),
      reportId: z.coerce.number(),
    }),
  },
  response: reportSchema,
})(({ database, path: { playerId, reportId } }) => {
  const reportInfo = database.selectObject({
    sql: selectReportTypeQuery,
    bind: { $player_id: playerId, $report_id: reportId },
    schema: getReportTypeRowSchema,
  });

  if (!reportInfo) {
    throw new Error(`Report ${reportId} not found for player ${playerId}`);
  }

  const bind = { $player_id: playerId, $report_id: reportId };

  if (reportInfo.type === 'battle') {
    const rows = database.selectObjects({
      sql: selectBattleReportQuery,
      bind,
      schema: battleReportRowSchema,
    });

    return mapBattleReportRowToDto(rows);
  }

  if (reportInfo.type === 'adventure') {
    const row = database.selectObject({
      sql: selectAdventureReportQuery,
      bind,
      schema: adventureReportRowSchema,
    })!;

    return mapAdventureReportRowToDto(row);
  }

  if (reportInfo.type === 'movement') {
    const row = database.selectObject({
      sql: selectMovementReportQuery,
      bind,
      schema: movementReportRowSchema,
    })!;

    const movementUnits = database.selectObjects({
      sql: `
        SELECT ui.unit AS unitId, mru.amount
        FROM movement_report_units mru
        JOIN unit_ids ui ON mru.unit_id = ui.id
        WHERE mru.movement_report_id = $movement_report_id;
      `,
      bind: { $movement_report_id: row.movement_id },
      schema: z.strictObject({ unitId: unitIdSchema, amount: z.int() }),
    });

    return mapMovementReportRowToDto(row, movementUnits);
  }

  const row = database.selectObject({
    sql: selectTradeReportQuery,
    bind,
    schema: tradeReportRowSchema,
  })!;

  return mapTradeReportRowToDto(row);
});

export const updateReports = createController('/reports', 'patch', {
  summary: 'Update reports',
  requestBody: z.strictObject({
    reportIds: z.array(z.int()),
    addTags: z.array(reportTagSchema).optional(),
    removeTags: z.array(reportTagSchema).optional(),
  }),
})(({ database, body: { reportIds, addTags, removeTags } }) => {
  database.transaction(() => {
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
});

export const deleteReports = createController('/reports', 'delete', {
  summary: 'Delete reports',
  requestBody: z.array(z.int()),
})(({ database, body }) => {
  database.exec({
    sql: deleteReportQuery,
    bind: {
      $report_ids: JSON.stringify(body),
    },
  });
});
