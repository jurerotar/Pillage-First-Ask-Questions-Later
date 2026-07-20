import { z } from 'zod';
import type { reportListingDtoSchema } from '@pillage-first/types/dtos/report';
import type {
  BattleReportSummary,
  Report,
} from '@pillage-first/types/models/report';
import { reportSchema } from '@pillage-first/types/models/report';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { getBattle } from '../../../utils/report';
import type { getReportsRowSchema } from '../schemas/report-schemas';

type ReportRow = z.infer<typeof getReportsRowSchema>;
type ReportListingDto = z.infer<typeof reportListingDtoSchema>;
type ReportDto = Report;

const getReportSummary = (row: ReportRow): BattleReportSummary => {
  if (
    row.battle_is_raid === null ||
    row.battle_origin_name === null ||
    row.battle_origin_x === null ||
    row.battle_origin_y === null ||
    row.battle_target_name === null ||
    row.battle_target_x === null ||
    row.battle_target_y === null
  ) {
    throw new Error(`Battle report ${row.id} is missing summary data`);
  }

  return {
    originName: row.battle_origin_name,
    originCoordinates: { x: row.battle_origin_x, y: row.battle_origin_y },
    targetName: row.battle_target_name,
    targetCoordinates: { x: row.battle_target_x, y: row.battle_target_y },
    movementType: row.battle_is_raid ? 'raid' : 'attack',
  };
};

const getMovementSummary = (row: ReportRow) => {
  if (
    row.movement_type === null ||
    row.movement_origin_name === null ||
    row.movement_origin_x === null ||
    row.movement_origin_y === null ||
    row.movement_target_name === null ||
    row.movement_target_x === null ||
    row.movement_target_y === null
  ) {
    throw new Error(`Movement report ${row.id} is missing summary data`);
  }

  return {
    originName: row.movement_origin_name,
    originCoordinates: {
      x: row.movement_origin_x,
      y: row.movement_origin_y,
    },
    targetName: row.movement_target_name,
    targetCoordinates: {
      x: row.movement_target_x,
      y: row.movement_target_y,
    },
    movementType: row.movement_type,
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

const mapReportListItem = (row: ReportRow): ReportListingDto => {
  const baseReport = mapBaseReportProperties(row);

  if (row.type === 'battle') {
    return {
      ...baseReport,
      type: 'battle',
      summary: getReportSummary(row),
    };
  }

  if (row.type === 'movement') {
    return {
      ...baseReport,
      type: 'movement',
      summary: getMovementSummary(row),
    };
  }

  return {
    ...baseReport,
    type: row.type,
    summary: null,
  };
};

export const mapReports = (rows: ReportRow[]): ReportListingDto[] => {
  const reportMap = new Map<number, ReportListingDto>();

  for (const row of rows) {
    let report = reportMap.get(row.id);

    if (report === undefined) {
      report = mapReportListItem(row);

      reportMap.set(report.id, report);
    }

    if (row.tag) {
      report.tags.push(row.tag);
    }
  }

  return [...reportMap.values()];
};

export const mapReport = (database: DbFacade, rows: ReportRow[]): ReportDto => {
  if (rows.length === 0) {
    throw new Error('Cannot map report from empty row set');
  }

  const tags: ReportDto['tags'] = [];
  for (const row of rows) {
    if (row.tag) {
      tags.push(row.tag);
    }
  }

  const row = rows[0];
  const baseReport = {
    ...mapBaseReportProperties(row),
    tags,
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
    if (
      row.adventure_id === null ||
      row.health_before === null ||
      row.health_after === null
    ) {
      throw new Error(`Adventure report ${row.id} is missing adventure data`);
    }

    return reportSchema.parse({
      ...baseReport,
      type: 'adventure',
      summary: null,
      adventureId: row.adventure_id,
      itemId: row.item_id,
      healthBefore: row.health_before,
      healthAfter: row.health_after,
    });
  }

  if (row.type === 'movement') {
    if (
      row.movement_id === null ||
      row.movement_type === null ||
      row.movement_origin_tile_id === null ||
      row.movement_target_tile_id === null
    ) {
      throw new Error(`Movement report ${row.id} is missing movement data`);
    }

    const units = database.selectObjects({
      sql: `
        SELECT ui.unit AS unitId, mru.amount
        FROM movement_report_units mru
        JOIN unit_ids ui ON mru.unit_id = ui.id
        WHERE mru.movement_report_id = $movement_report_id;
      `,
      bind: { $movement_report_id: row.movement_id },
      schema: z.strictObject({ unitId: z.string(), amount: z.int() }),
    });

    return reportSchema.parse({
      ...baseReport,
      type: 'movement',
      summary: getMovementSummary(row),
      movement: {
        id: row.movement_id,
        originTileId: row.movement_origin_tile_id,
        targetTileId: row.movement_target_tile_id,
        movementType: row.movement_type,
        units,
      },
    });
  }

  const report = reportSchema.parse({
    ...baseReport,
    type: row.type,
    summary: null,
  });

  return report;
};
