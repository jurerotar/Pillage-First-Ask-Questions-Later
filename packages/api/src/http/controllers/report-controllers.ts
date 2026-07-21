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
  deleteReportTagsQuery,
  insertReportTagsQuery,
  selectAdventureReportQuery,
  selectBattleReportQuery,
  selectGatheringExpeditionReportQuery,
  selectHuntingPartyReportQuery,
  selectMovementReportQuery,
  selectReportListingsQuery,
  selectReportTypeQuery,
  selectTradeReportQuery,
} from '../../queries/report-queries';
import { createController } from '../controller';
import {
  mapAdventureReportRowToDto,
  mapBattleReportRowToDto,
  mapGatheringExpeditionReportRowToDto,
  mapHuntingPartyReportRowToDto,
  mapMovementReportRowToDto,
  mapReportListingRowToDto,
  mapTradeReportRowToDto,
} from './mappers/report-mapper';
import {
  adventureReportRowSchema,
  battleReportRowSchema,
  gatheringExpeditionReportRowSchema,
  getReportListingsRowSchema,
  getReportTypeRowSchema,
  huntingPartyReportRowSchema,
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
      $include_hunting_party: reportTypes.includes('huntingParty') ? 1 : 0,
      $include_gathering_expedition: reportTypes.includes('gatheringExpedition')
        ? 1
        : 0,
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

  if (reportInfo.type === 'huntingParty') {
    const row = database.selectObject({
      sql: selectHuntingPartyReportQuery,
      bind,
      schema: huntingPartyReportRowSchema,
    })!;

    const units = database.selectObjects({
      sql: 'SELECT ui.unit AS unitId, hpru.amount FROM hunting_party_report_units hpru JOIN unit_ids ui ON ui.id = hpru.unit_id WHERE hpru.hunting_party_report_id = $report_detail_id;',
      bind: { $report_detail_id: row.expedition_id },
      schema: z.strictObject({ unitId: unitIdSchema, amount: z.int() }),
    });

    return mapHuntingPartyReportRowToDto(row, units);
  }

  if (reportInfo.type === 'gatheringExpedition') {
    const row = database.selectObject({
      sql: selectGatheringExpeditionReportQuery,
      bind,
      schema: gatheringExpeditionReportRowSchema,
    })!;

    const units = database.selectObjects({
      sql: 'SELECT ui.unit AS unitId, geru.amount FROM gathering_expedition_report_units geru JOIN unit_ids ui ON ui.id = geru.unit_id WHERE geru.gathering_expedition_report_id = $report_detail_id;',
      bind: { $report_detail_id: row.expedition_id },
      schema: z.strictObject({ unitId: unitIdSchema, amount: z.int() }),
    });

    return mapGatheringExpeditionReportRowToDto(row, units);
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
    reportIds: z.array(z.int()).min(1),
    tags: z
      .partialRecord(reportTagSchema, z.boolean())
      .refine(
        (tags) => Object.keys(tags).length > 0,
        'No tag updates provided',
      ),
  }),
})(({ database, body: { reportIds, tags } }) => {
  const bind = {
    $report_ids: JSON.stringify(reportIds),
    $tags: JSON.stringify(tags),
  };

  database.transaction(() => {
    database.exec({ sql: insertReportTagsQuery, bind });
    database.exec({ sql: deleteReportTagsQuery, bind });
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
