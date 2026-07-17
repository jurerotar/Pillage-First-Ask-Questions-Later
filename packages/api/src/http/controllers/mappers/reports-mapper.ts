import type { z } from 'zod';
import {
  type baseReportDtoSchema,
  reportDtoSchema,
} from '@pillage-first/types/dtos/report';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { getBattle } from '../../../utils/report';
import type { getReportsRowSchema } from '../schemas/report-schemas';

type ReportRow = z.infer<typeof getReportsRowSchema>;
type ReportListDto = z.infer<typeof baseReportDtoSchema>;
type BattleReportListDto = Extract<ReportListDto, { type: 'battle' }>;
type ReportDto = z.infer<typeof reportDtoSchema>;

const getBattleSummary = (
  row: ReportRow,
): BattleReportListDto['battleSummary'] => {
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

const getBattleResultId = (
  row: ReportRow,
): Exclude<ReportRow['battle_result_id'], null> => {
  if (row.battle_result_id === null) {
    throw new Error(`Battle report ${row.id} is missing battle result`);
  }

  return row.battle_result_id;
};

const mapBaseReportProperties = (row: ReportRow) => ({
  id: row.id,
  playerId: row.player_id,
  villageId: row.village_id,
  timestamp: row.timestamp,
  tags: [],
});

const mapReportListItem = (row: ReportRow): ReportListDto => {
  const baseReport = mapBaseReportProperties(row);

  if (row.type === 'battle') {
    return {
      ...baseReport,
      type: 'battle',
      battleSummary: getBattleSummary(row),
      battleResultId: getBattleResultId(row),
    };
  }

  return {
    ...baseReport,
    type: row.type,
  };
};

export const mapReports = (rows: ReportRow[]): ReportListDto[] => {
  const reportMap = new Map<number, ReportListDto>();

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
    return reportDtoSchema.parse({
      ...baseReport,
      type: 'battle',
      battleSummary: getBattleSummary(row),
      battleResultId: getBattleResultId(row),
      battle: getBattle(database, row.id),
    });
  }

  return reportDtoSchema.parse({
    ...baseReport,
    type: row.type,
  });
};
