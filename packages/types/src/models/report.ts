import { z } from 'zod';
import { battleSchema } from './battle';
import { coordinatesSchema } from './coordinates';
import { resourceBundleSchema } from './resource';
import { tribeSchema } from './tribe';
import { unitIdSchema } from './unit';

export const reportTypeSchema = z.enum([
  'battle',
  'adventure',
  'trade',
  'movement',
]);

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
  'troopMovement',
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
  summary: z.strictObject({
    originPlayerName: z.string(),
    originPlayerSlug: z.string(),
    originVillageName: z.string(),
    originCoordinates: coordinatesSchema,
    tribe: tribeSchema,
  }),
  adventureId: z.int(),
  itemId: z.int().nullable(),
  itemAmount: z.int().positive().nullable(),
  healthBefore: z.number(),
  healthAfter: z.number(),
});

export const tradeReportSchema = baseReportSchema.extend({
  type: z.literal('trade'),
  summary: z.strictObject({
    originPlayerName: z.string(),
    originPlayerSlug: z.string(),
    originName: z.string(),
    originCoordinates: coordinatesSchema,
    targetPlayerName: z.string(),
    targetPlayerSlug: z.string(),
    targetName: z.string(),
    targetCoordinates: coordinatesSchema,
  }),
  trade: z.strictObject({
    id: z.int(),
    originTileId: z.int(),
    targetTileId: z.int(),
    resources: resourceBundleSchema,
  }),
});

export const movementReportSummarySchema = z.strictObject({
  originPlayerName: z.string(),
  originPlayerSlug: z.string(),
  originName: z.string(),
  originCoordinates: coordinatesSchema,
  targetPlayerName: z.string().nullable(),
  targetPlayerSlug: z.string().nullable(),
  targetName: z.string(),
  targetCoordinates: coordinatesSchema,
  movementType: z.enum(['reinforcement', 'relocation']),
});

export const movementReportUnitSchema = z.strictObject({
  unitId: unitIdSchema,
  amount: z.int(),
});

export const movementReportSchema = baseReportSchema.extend({
  type: z.literal('movement'),
  summary: movementReportSummarySchema,
  movement: z.strictObject({
    id: z.int(),
    tribe: tribeSchema,
    originTileId: z.int(),
    targetTileId: z.int(),
    movementType: z.enum(['reinforcement', 'relocation']),
    units: z.array(movementReportUnitSchema),
  }),
});

export const reportSchema = z
  .discriminatedUnion('type', [
    battleReportSchema,
    adventureReportSchema,
    tradeReportSchema,
    movementReportSchema,
  ])
  .meta({ id: 'Report' });

export type ReportType = z.infer<typeof reportTypeSchema>;
export type ReportTag = z.infer<typeof reportTagSchema>;
export type BattleResultId = z.infer<typeof battleResultIdSchema>;
export type ReportOutcome = z.infer<typeof reportOutcomeSchema>;

export type BattleReportSummary = z.infer<typeof battleReportSummarySchema>;
export type BaseReport = z.infer<typeof baseReportSchema>;
export type Report = z.infer<typeof reportSchema>;
export type BattleReport = z.infer<typeof battleReportSchema>;
export type AdventureReport = z.infer<typeof adventureReportSchema>;
export type TroopMovementReport = z.infer<typeof movementReportSchema>;
export type TradeReport = z.infer<typeof tradeReportSchema>;
