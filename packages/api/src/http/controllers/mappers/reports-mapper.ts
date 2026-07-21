import { z } from 'zod';
import { reportListingDtoSchema } from '@pillage-first/types/dtos/report';
import type {
  BattleReportSummary,
  Report,
} from '@pillage-first/types/models/report';
import { reportSchema } from '@pillage-first/types/models/report';
import { unitIdSchema } from '@pillage-first/types/models/unit';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { getBattle } from '../../../utils/report';
import type {
  getReportListingsRowSchema,
  getReportsRowSchema,
} from '../schemas/report-schemas';

type ReportRow = z.infer<typeof getReportsRowSchema>;
type ReportListingRow = z.infer<typeof getReportListingsRowSchema>;
type BattleReportRow = Extract<ReportRow, { type: 'battle' }>;
type AdventureReportRow = Extract<ReportRow, { type: 'adventure' }>;
type MovementReportRow = Extract<ReportRow, { type: 'movement' }>;
type TradeReportRow = Extract<ReportRow, { type: 'trade' }>;
type ReportListingDto = z.infer<typeof reportListingDtoSchema>;
type ReportDto = Report;

const getReportSummary = (row: BattleReportRow): BattleReportSummary => {
  return {
    originName: row.battle_origin_name,
    originCoordinates: { x: row.battle_origin_x, y: row.battle_origin_y },
    targetName: row.battle_target_name,
    targetCoordinates: { x: row.battle_target_x, y: row.battle_target_y },
    movementType: row.battle_is_raid ? 'raid' : 'attack',
  };
};

const getAdventureSummary = (row: AdventureReportRow) => {
  return {
    originPlayerName: row.adventure_origin_player_name,
    originPlayerSlug: row.adventure_origin_player_slug,
    originVillageName: row.adventure_origin_village_name,
    originCoordinates: {
      x: row.adventure_origin_x,
      y: row.adventure_origin_y,
    },
    tribe: row.adventure_origin_tribe,
  };
};

const getMovementSummary = (row: MovementReportRow) => {
  return {
    originPlayerName: row.movement_origin_player_name,
    originPlayerSlug: row.movement_origin_player_slug,
    originName: row.movement_origin_name,
    originCoordinates: {
      x: row.movement_origin_x,
      y: row.movement_origin_y,
    },
    targetPlayerName: row.movement_target_player_name,
    targetPlayerSlug: row.movement_target_player_slug,
    targetName: row.movement_target_name,
    targetCoordinates: {
      x: row.movement_target_x,
      y: row.movement_target_y,
    },
    movementType: row.movement_type,
  };
};

const getTradeSummary = (row: TradeReportRow) => {
  return {
    originPlayerName: row.trade_origin_player_name,
    originPlayerSlug: row.trade_origin_player_slug,
    originName: row.trade_origin_name,
    originCoordinates: { x: row.trade_origin_x, y: row.trade_origin_y },
    targetPlayerName: row.trade_target_player_name,
    targetPlayerSlug: row.trade_target_player_slug,
    targetName: row.trade_target_name,
    targetCoordinates: { x: row.trade_target_x, y: row.trade_target_y },
  };
};

const mapBaseReportProperties = (row: ReportRow) => ({
  id: row.id,
  playerId: row.player_id,
  villageId: row.village_id,
  timestamp: row.timestamp,
  outcome: row.outcome,
  tags: [],
});

export const mapReportListings = (
  rows: ReportListingRow[],
): ReportListingDto[] => {
  return rows.map((row) =>
    reportListingDtoSchema.parse({
      id: row.id,
      playerId: row.player_id,
      villageId: row.village_id,
      timestamp: row.timestamp,
      type: row.type,
      outcome: row.outcome,
      summary: JSON.parse(row.summary_json),
      tags: JSON.parse(row.tags_json),
    }),
  );
};

export const mapReport = (database: DbFacade, rows: ReportRow[]): ReportDto => {
  if (rows.length === 0) {
    throw new Error('Cannot map report from empty row set');
  }

  const tags = new Set<ReportDto['tags'][number]>();
  for (const row of rows) {
    if (row.tag) {
      tags.add(row.tag);
    }
  }

  const row = rows[0];
  const baseReport = {
    ...mapBaseReportProperties(row),
    tags: [...tags],
  };

  if (row.type === 'battle') {
    const report = reportSchema.parse({
      ...baseReport,
      type: 'battle',
      summary: getReportSummary(row),
      battle: getBattle(database, row.id),
    });

    return report;
  }

  if (row.type === 'adventure') {
    return reportSchema.parse({
      ...baseReport,
      type: 'adventure',
      summary: getAdventureSummary(row),
      adventureId: row.adventure_id,
      itemId: row.item_id,
      itemAmount: row.item_amount,
      healthBefore: row.health_before,
      healthAfter: row.health_after,
    });
  }

  if (row.type === 'movement') {
    const units = database.selectObjects({
      sql: `
        SELECT ui.unit AS unitId, mru.amount
        FROM movement_report_units mru
        JOIN unit_ids ui ON mru.unit_id = ui.id
        WHERE mru.movement_report_id = $movement_report_id;
      `,
      bind: { $movement_report_id: row.movement_id },
      schema: z.strictObject({ unitId: unitIdSchema, amount: z.int() }),
    });

    return reportSchema.parse({
      ...baseReport,
      type: 'movement',
      summary: getMovementSummary(row),
      movement: {
        id: row.movement_id,
        tribe: row.movement_tribe,
        originTileId: row.movement_origin_tile_id,
        targetTileId: row.movement_target_tile_id,
        movementType: row.movement_type,
        units,
      },
    });
  }

  if (row.type === 'trade') {
    return reportSchema.parse({
      ...baseReport,
      type: 'trade',
      summary: getTradeSummary(row),
      trade: {
        id: row.trade_id,
        originTileId: row.trade_origin_tile_id,
        targetTileId: row.trade_target_tile_id,
        resources: [
          row.trade_wood,
          row.trade_clay,
          row.trade_iron,
          row.trade_wheat,
        ],
      },
    });
  }

  row satisfies never;
  throw new Error('Unsupported report type');
};
