import { z } from 'zod';
import { battleSchema } from './battle';
import { coordinatesSchema } from './coordinates';

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

export const battleReportSummarySchema = z.strictObject({
  originName: z.string(),
  originCoordinates: coordinatesSchema,
  targetName: z.string(),
  targetCoordinates: coordinatesSchema,
  movementType: z.enum(['raid', 'attack']),
});

export const battleReportSchema = baseReportSchema.extend({
  type: z.literal('battle'),
  summary: battleReportSummarySchema,
  battle: battleSchema,
});

export const adventureReportSchema = baseReportSchema.extend({
  type: z.literal('adventure'),
  summary: z.null(),
});

export const tradeReportSchema = baseReportSchema.extend({
  type: z.literal('trade'),
  summary: z.null(),
});

export const reportSchema = z
  .discriminatedUnion('type', [
    battleReportSchema,
    adventureReportSchema,
    tradeReportSchema,
  ])
  .meta({ id: 'Report' });

export type ReportType = z.infer<typeof reportTypeSchema>;
export type ReportTag = z.infer<typeof reportTagSchema>;
export type BattleResultId = z.infer<typeof battleResultIdSchema>;
export type ReportOutcome = z.infer<typeof reportOutcomeSchema>;

export type BattleReportSummary = z.infer<typeof battleReportSummarySchema>;
export type BaseReport = z.infer<typeof baseReportSchema>;
export type Report = z.infer<typeof reportSchema>;
