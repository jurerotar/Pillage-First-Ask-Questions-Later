import type { z } from 'zod';
import type { reportListingDtoSchema } from '@pillage-first/types/dtos/report';
import { reportSchema } from '@pillage-first/types/models/report';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { getBattle } from '../../../utils/report';
import type { getReportsRowSchema } from '../schemas/report-schemas';

type ReportRow = z.infer<typeof getReportsRowSchema>;
type ReportListingDto = z.infer<typeof reportListingDtoSchema>;
type BattleReportListingDto = Extract<ReportListingDto, { type: 'battle' }>;
type ReportDto = z.infer<typeof reportSchema>;

const getBattleSummary = (
  row: ReportRow,
): BattleReportListingDto['battleSummary'] => {
  if (
    row.battle_is_raid === null ||
    row.battle_origin_name === null ||
    row.battle_target_name === null ||
    row.battle_target_x === null ||
    row.battle_target_y === null
  ) {
    throw new Error(`Battle report ${row.id} is missing battle summary data`);
  }

  return {
    isRaid: Boolean(row.battle_is_raid),
    originName: row.battle_origin_name,
    targetName: row.battle_target_name,
    targetCoordinates: {
      x: row.battle_target_x,
      y: row.battle_target_y,
    },
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
      battleSummary: getBattleSummary(row),
    };
  }

  return {
    ...baseReport,
    type: row.type,
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
    return reportSchema.parse({
      ...baseReport,
      type: 'battle',
      battleSummary: getBattleSummary(row),
      battle: getBattle(database, row.id),
    });
  }

  return reportSchema.parse({
    ...baseReport,
    type: row.type,
  });
};
