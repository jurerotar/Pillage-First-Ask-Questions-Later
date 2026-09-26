import { z } from 'zod';
import { battleSchema } from './battle';
import { buildingIdSchema } from './building';
import { coordinatesSchema } from './coordinates';
import { resourceBundleSchema } from './resource';
import { tribeSchema } from './tribe';
import { unitIdSchema } from './unit';

export const reportTypeSchema = z.enum([
  'battle',
  'adventure',
  'trade',
  'movement',
  'huntingParty',
  'gatheringExpedition',
  'scouting',
  'unitResearch',
  'unitImprovement',
  'villageFounded',
  'scheduledConstructionCancellation',
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
  'huntingParty',
  'gatheringExpedition',
  'unitResearched',
  'unitImproved',
  'villageFounded',
  'scheduledConstructionCancelled',
]);

export const reportTagSchema = z.enum(['read', 'archived']);

export const reportSideSchema = z.enum(['attacker', 'defender']);

export const baseReportSchema = z.strictObject({
  id: z.int(),
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

const expeditionReportSummarySchema = z.strictObject({
  villageName: z.string(),
  villageCoordinates: coordinatesSchema,
});

const expeditionUnitSchema = z.strictObject({
  unitId: unitIdSchema,
  amount: z.int().positive(),
});

export const huntingPartyReportSchema = baseReportSchema.extend({
  type: z.literal('huntingParty'),
  summary: expeditionReportSummarySchema,
  tribe: z.literal('nature'),
  units: z.array(expeditionUnitSchema),
});

export const gatheringExpeditionReportSchema = baseReportSchema.extend({
  type: z.literal('gatheringExpedition'),
  summary: expeditionReportSummarySchema,
  tribe: tribeSchema,
  units: z.array(expeditionUnitSchema),
  loot: resourceBundleSchema,
});

export const scoutingReportSummarySchema = z.strictObject({
  originPlayerName: z.string(),
  originPlayerSlug: z.string(),
  originName: z.string(),
  originCoordinates: coordinatesSchema,
  targetPlayerName: z.string(),
  targetPlayerSlug: z.string(),
  targetName: z.string(),
  targetCoordinates: coordinatesSchema,
});

const scoutingTroopsSchema = z.strictObject({
  tribe: tribeSchema,
  units: z.array(z.strictObject({ unitId: unitIdSchema, amount: z.int() })),
});

const scoutingAttackerTroopsSchema = z.strictObject({
  tribe: tribeSchema,
  units: z.array(
    z.strictObject({
      unitId: unitIdSchema,
      amountBefore: z.int(),
      amountAfter: z.int(),
    }),
  ),
});

const scoutingReinforcementSchema = scoutingTroopsSchema.extend({
  player: z.strictObject({ name: z.string(), slug: z.string() }),
  village: z.strictObject({ name: z.string(), coordinates: coordinatesSchema }),
});

export const scoutingReportSchema = baseReportSchema.extend({
  type: z.literal('scouting'),
  summary: scoutingReportSummarySchema,
  scouting: z
    .strictObject({
      id: z.int(),
      perspective: reportSideSchema,
      successful: z.boolean(),
      target: z.enum(['resources', 'defensiveStructures']),
      attacker: scoutingAttackerTroopsSchema,
      defender: scoutingTroopsSchema.extend({
        reinforcements: z.array(scoutingReinforcementSchema),
      }),
      resources: resourceBundleSchema.nullable(),
      itemId: z.int().nullable(),
      itemAmount: z.int().positive().nullable(),
      defensiveStructures: z.array(
        z.strictObject({
          buildingId: buildingIdSchema,
          level: z.int().nonnegative(),
        }),
      ),
    })
    .refine(
      ({ itemId, itemAmount }) => (itemId === null) === (itemAmount === null),
      {
        message: 'Item id and amount must either both be set or both be null',
        path: ['itemAmount'],
      },
    ),
});

const unitReportSummarySchema = z.strictObject({
  villageId: z.int(),
  villageName: z.string(),
  villageCoordinates: coordinatesSchema,
});

export const unitResearchReportSchema = baseReportSchema.extend({
  type: z.literal('unitResearch'),
  summary: unitReportSummarySchema,
  unitId: unitIdSchema,
});

export const unitImprovementReportSchema = baseReportSchema.extend({
  type: z.literal('unitImprovement'),
  summary: unitReportSummarySchema,
  unitId: unitIdSchema,
  level: z.int().positive(),
});

export const villageFoundedReportSchema = baseReportSchema.extend({
  type: z.literal('villageFounded'),
  summary: z.strictObject({
    originName: z.string(),
    originCoordinates: coordinatesSchema,
    targetName: z.string(),
    targetCoordinates: coordinatesSchema,
  }),
  originTileId: z.int(),
  targetTileId: z.int(),
});

export const scheduledConstructionCancellationReasonSchema = z.enum([
  'missing-resources',
  'missing-requirements',
]);

export const scheduledConstructionCancellationReportSchema =
  baseReportSchema.extend({
    type: z.literal('scheduledConstructionCancellation'),
    summary: unitReportSummarySchema,
    buildingId: buildingIdSchema,
    buildingFieldId: z.int(),
    level: z.int().positive(),
    reason: scheduledConstructionCancellationReasonSchema,
  });

export const reportSchema = z
  .discriminatedUnion('type', [
    battleReportSchema,
    adventureReportSchema,
    tradeReportSchema,
    movementReportSchema,
    huntingPartyReportSchema,
    gatheringExpeditionReportSchema,
    scoutingReportSchema,
    unitResearchReportSchema,
    unitImprovementReportSchema,
    villageFoundedReportSchema,
    scheduledConstructionCancellationReportSchema,
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
export type HuntingPartyReport = z.infer<typeof huntingPartyReportSchema>;
export type GatheringExpeditionReport = z.infer<
  typeof gatheringExpeditionReportSchema
>;
export type ScoutingReport = z.infer<typeof scoutingReportSchema>;
export type UnitResearchReport = z.infer<typeof unitResearchReportSchema>;
export type UnitImprovementReport = z.infer<typeof unitImprovementReportSchema>;
export type VillageFoundedReport = z.infer<typeof villageFoundedReportSchema>;
export type ScheduledConstructionCancellationReason = z.infer<
  typeof scheduledConstructionCancellationReasonSchema
>;
export type ScheduledConstructionCancellationReport = z.infer<
  typeof scheduledConstructionCancellationReportSchema
>;
