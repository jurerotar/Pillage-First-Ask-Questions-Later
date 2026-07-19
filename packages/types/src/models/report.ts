import { z } from 'zod';
import { battleSchema, battleSummarySchema } from './battle';

export const reportTypeSchema = z.enum(['battle', 'adventure', 'trade']);

export const battleResultIdSchema = z.enum([
  'attackerNoLoss',
  'attackerSomeLoss',
  'attackerFullLoss',
  'defenderNoLoss',
  'defenderSomeLoss',
  'defenderFullLoss',
]);

export const reportOutcomeSchema = z.enum([
  ...battleResultIdSchema.options,
  'scoutAttackerNoLoss',
  'scoutAttackerSomeLoss',
  'scoutAttackerFullLoss',
  'scoutDefenderNoLoss',
  'scoutDefenderSomeLoss',
  'scoutDefenderFullLoss',
  'outgoingMerchantsArrived',
  'incomingMerchantsArrived',
  'heroAdventure',
]);

export const reportTagSchema = z.enum(['read', 'archived']);

export const baseReportSchema = z.strictObject({
  id: z.int(),
  playerId: z.int(),
  villageId: z.int(),
  timestamp: z.int(),
  type: reportTypeSchema,
  outcome: reportOutcomeSchema,
  tags: z.array(reportTagSchema),
});

export const battleReportSchema = baseReportSchema.extend({
  type: z.literal('battle'),
  battleSummary: battleSummarySchema,
  battle: battleSchema,
});

export const adventureReportSchema = baseReportSchema.extend({
  type: z.literal('adventure'),
});

export const tradeReportSchema = baseReportSchema.extend({
  type: z.literal('trade'),
});

export const gameReportSchema = z
  .discriminatedUnion('type', [
    battleReportSchema,
    adventureReportSchema,
    tradeReportSchema,
  ])
  .meta({ id: 'GameReport' });

export type ReportType = z.infer<typeof reportTypeSchema>;
export type ReportTag = z.infer<typeof reportTagSchema>;
export type BattleResultId = z.infer<typeof battleResultIdSchema>;
export type ReportOutcome = z.infer<typeof reportOutcomeSchema>;

export type BaseReport = z.infer<typeof baseReportSchema>;
export type BattleReport = z.infer<typeof battleReportSchema>;
export type AdventureReport = z.infer<typeof adventureReportSchema>;
export type TradeReport = z.infer<typeof tradeReportSchema>;
export type GameReport = z.infer<typeof gameReportSchema>;
