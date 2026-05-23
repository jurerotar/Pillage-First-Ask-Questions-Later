import { z } from 'zod';
import type {
  BattleReportPayload,
  Report,
  ReportOutcome,
  ReportType,
} from '@pillage-first/types/models/report';
import type { DbFacade } from '@pillage-first/utils/facades/database';

type InsertReportArgs = {
  type: ReportType;
  timestamp: number;
  villageId: number;
  defenderTileId: number;
  outcome: ReportOutcome;
  payload: BattleReportPayload;
};

export const insertReport = (
  database: DbFacade,
  args: InsertReportArgs,
): Report['id'] => {
  return database.selectValue({
    sql: `
      INSERT INTO reports (type, timestamp, village_id, defender_tile_id, outcome, payload)
      VALUES ($type, $timestamp, $village_id, $defender_tile_id, $outcome, $payload)
      RETURNING id;
    `,
    bind: {
      $type: args.type,
      $timestamp: args.timestamp,
      $village_id: args.villageId,
      $defender_tile_id: args.defenderTileId,
      $outcome: args.outcome,
      $payload: JSON.stringify(args.payload),
    },
    schema: z.number(),
  })!;
};
