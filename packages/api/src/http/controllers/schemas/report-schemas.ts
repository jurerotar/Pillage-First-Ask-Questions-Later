import { z } from 'zod';
import {
  battleSiegeResultSchema,
  oasisCaptureFailureReasonSchema,
  villageConquestFailureReasonSchema,
} from '@pillage-first/types/models/battle';
import { buildingIdSchema } from '@pillage-first/types/models/building';
import {
  reportOutcomeSchema,
  reportSideSchema,
  reportTypeSchema,
  scheduledConstructionCancellationReasonSchema,
} from '@pillage-first/types/models/report';
import { resourcesSchema } from '@pillage-first/types/models/resource';
import { tileIdSchema } from '@pillage-first/types/models/tile';
import { tribeSchema } from '@pillage-first/types/models/tribe';
import { unitIdSchema } from '@pillage-first/types/models/unit';

export const getReportListingsRowSchema = z.strictObject({
  id: z.int(),
  village_id: z.int(),
  timestamp: z.int(),
  type: reportTypeSchema,
  outcome: reportOutcomeSchema,
  summary_json: z.string(),
  tags_json: z.string(),
});

export const getReportTypeRowSchema = z.strictObject({
  type: reportTypeSchema,
});

const nullableReportDetailColumns = z
  .strictObject({
    battle_is_raid: z.int().nullable(),
    battle_origin_name: z.string().nullable(),
    battle_origin_x: z.int().nullable(),
    battle_origin_y: z.int().nullable(),
    battle_target_name: z.string().nullable(),
    battle_target_x: z.int().nullable(),
    battle_target_y: z.int().nullable(),
    adventure_id: z.int().nullable(),
    item_id: z.int().nullable(),
    item_amount: z.int().nullable(),
    health_before: z.number().nullable(),
    health_after: z.number().nullable(),
    adventure_origin_player_name: z.string().nullable(),
    adventure_origin_player_slug: z.string().nullable(),
    adventure_origin_village_name: z.string().nullable(),
    adventure_origin_x: z.int().nullable(),
    adventure_origin_y: z.int().nullable(),
    adventure_origin_tribe: tribeSchema.nullable(),
    movement_id: z.int().nullable(),
    movement_type: z.enum(['reinforcement', 'relocation']).nullable(),
    movement_tribe: tribeSchema.nullable(),
    movement_origin_tile_id: tileIdSchema.nullable(),
    movement_target_tile_id: tileIdSchema.nullable(),
    movement_origin_player_name: z.string().nullable(),
    movement_origin_player_slug: z.string().nullable(),
    movement_origin_name: z.string().nullable(),
    movement_origin_x: z.int().nullable(),
    movement_origin_y: z.int().nullable(),
    movement_target_player_name: z.string().nullable(),
    movement_target_player_slug: z.string().nullable(),
    movement_target_name: z.string().nullable(),
    movement_target_x: z.int().nullable(),
    movement_target_y: z.int().nullable(),
    trade_id: z.int().nullable(),
    trade_origin_tile_id: tileIdSchema.nullable(),
    trade_target_tile_id: tileIdSchema.nullable(),
    trade_origin_player_name: z.string().nullable(),
    trade_origin_player_slug: z.string().nullable(),
    trade_origin_name: z.string().nullable(),
    trade_origin_x: z.int().nullable(),
    trade_origin_y: z.int().nullable(),
    trade_target_player_name: z.string().nullable(),
    trade_target_player_slug: z.string().nullable(),
    trade_target_name: z.string().nullable(),
    trade_target_x: z.int().nullable(),
    trade_target_y: z.int().nullable(),
    trade_wood: resourcesSchema.shape.wood.nullable(),
    trade_clay: resourcesSchema.shape.clay.nullable(),
    trade_iron: resourcesSchema.shape.iron.nullable(),
    trade_wheat: resourcesSchema.shape.wheat.nullable(),
  })
  .partial().shape;

const baseReportRowSchema = z.strictObject({
  id: z.int(),
  village_id: z.int(),
  timestamp: z.int(),
  outcome: reportOutcomeSchema,
  tags_json: z.string(),
  ...nullableReportDetailColumns,
});

export const battleReportRowSchema = baseReportRowSchema.extend({
  type: z.literal('battle'),
  battle_is_raid: z.union([z.literal(0), z.literal(1)]),
  battle_origin_name: z.string(),
  battle_origin_x: z.int(),
  battle_origin_y: z.int(),
  battle_target_name: z.string(),
  battle_target_x: z.int(),
  battle_target_y: z.int(),
  battle_id: z.int(),
  origin_tile_id: tileIdSchema,
  target_tile_id: tileIdSchema,
  loot_wood: resourcesSchema.shape.wood,
  loot_clay: resourcesSchema.shape.clay,
  loot_iron: resourcesSchema.shape.iron,
  loot_wheat: resourcesSchema.shape.wheat,
  attacker_points: z.int().nonnegative(),
  defender_points: z.int().nonnegative(),
  loyalty_before: z.number().min(0).max(125).nullable(),
  loyalty_after: z.number().min(0).max(125).nullable(),
  conquest_target: z.enum(['village', 'oasis']).nullable(),
  conquest_succeeded: z.union([z.literal(0), z.literal(1)]).nullable(),
  conquest_failure_reason: z
    .union([
      villageConquestFailureReasonSchema,
      oasisCaptureFailureReasonSchema,
    ])
    .nullable(),
  village_destroyed: z.union([z.literal(0), z.literal(1)]),
  traps_destroyed: z.int().nonnegative(),
  rescued_units_json: z.string(),
  captured_animals_json: z.string(),
  stolen_items_json: z.string(),
  hero_json: z.string().nullable(),
  participant_id: z.int(),
  participant_player_id: z.int().nullable(),
  participant_tile_id: tileIdSchema,
  participant_role: reportSideSchema,
  participant_tribe: tribeSchema,
  participant_is_reinforcement: z.union([z.literal(0), z.literal(1)]),
  participant_player_name: z.string(),
  participant_player_slug: z.string().nullable(),
  participant_village_id: z.int().nullable(),
  participant_location_name: z.string(),
  participant_x: z.int(),
  participant_y: z.int(),
  participant_unit_id: unitIdSchema.nullable(),
  participant_amount_before: z.int().nonnegative().nullable(),
  participant_amount_after: z.int().nonnegative().nullable(),
  participant_amount_hospitalized: z.int().nonnegative().nullable(),
  participant_amount_imprisoned: z.int().nonnegative().nullable(),
  participant_amount_bandaged: z.int().nonnegative().nullable(),
  participant_amount_consumed: z.int().nonnegative().nullable(),
});

export const battleReportSiegeResultRowSchema = battleSiegeResultSchema;

export const adventureReportRowSchema = baseReportRowSchema.extend({
  type: z.literal('adventure'),
  adventure_id: z.int(),
  health_before: z.number(),
  health_after: z.number(),
  adventure_origin_player_name: z.string(),
  adventure_origin_player_slug: z.string(),
  adventure_origin_village_name: z.string(),
  adventure_origin_x: z.int(),
  adventure_origin_y: z.int(),
  adventure_origin_tribe: tribeSchema,
});

export const movementReportRowSchema = baseReportRowSchema.extend({
  type: z.literal('movement'),
  movement_id: z.int(),
  movement_type: z.enum(['reinforcement', 'relocation']),
  movement_tribe: tribeSchema,
  movement_origin_tile_id: tileIdSchema,
  movement_target_tile_id: tileIdSchema,
  movement_origin_player_name: z.string(),
  movement_origin_player_slug: z.string(),
  movement_origin_name: z.string(),
  movement_origin_x: z.int(),
  movement_origin_y: z.int(),
  movement_target_name: z.string(),
  movement_target_x: z.int(),
  movement_target_y: z.int(),
});

export const tradeReportRowSchema = baseReportRowSchema.extend({
  type: z.literal('trade'),
  trade_id: z.int(),
  trade_origin_tile_id: tileIdSchema,
  trade_target_tile_id: tileIdSchema,
  trade_origin_player_name: z.string(),
  trade_origin_player_slug: z.string(),
  trade_origin_name: z.string(),
  trade_origin_x: z.int(),
  trade_origin_y: z.int(),
  trade_target_player_name: z.string(),
  trade_target_player_slug: z.string(),
  trade_target_name: z.string(),
  trade_target_x: z.int(),
  trade_target_y: z.int(),
  trade_wood: resourcesSchema.shape.wood,
  trade_clay: resourcesSchema.shape.clay,
  trade_iron: resourcesSchema.shape.iron,
  trade_wheat: resourcesSchema.shape.wheat,
});

const expeditionReportRowSchema = baseReportRowSchema.extend({
  expedition_id: z.int(),
  expedition_tribe: tribeSchema,
  expedition_village_name: z.string(),
  expedition_village_x: z.int(),
  expedition_village_y: z.int(),
  loot_wood: resourcesSchema.shape.wood.nullable(),
  loot_clay: resourcesSchema.shape.clay.nullable(),
  loot_iron: resourcesSchema.shape.iron.nullable(),
  loot_wheat: resourcesSchema.shape.wheat.nullable(),
});

export const huntingPartyReportRowSchema = expeditionReportRowSchema.extend({
  type: z.literal('huntingParty'),
});

export const gatheringExpeditionReportRowSchema =
  expeditionReportRowSchema.extend({
    type: z.literal('gatheringExpedition'),
  });

export const scoutingReportRowSchema = baseReportRowSchema.extend({
  type: z.literal('scouting'),
  scouting_id: z.int(),
  perspective: reportSideSchema,
  successful: z.int(),
  scouting_target: z.enum(['resources', 'defensiveStructures']),
  wood: resourcesSchema.shape.wood.nullable(),
  clay: resourcesSchema.shape.clay.nullable(),
  iron: resourcesSchema.shape.iron.nullable(),
  wheat: resourcesSchema.shape.wheat.nullable(),
  item_id: z.int().nullable(),
  item_amount: z.int().nullable(),
  origin_player_name: z.string(),
  origin_player_slug: z.string(),
  origin_name: z.string(),
  origin_x: z.int(),
  origin_y: z.int(),
  target_player_name: z.string(),
  target_player_slug: z.string(),
  target_name: z.string(),
  target_x: z.int(),
  target_y: z.int(),
  attacker_tribe: tribeSchema,
  defender_tribe: tribeSchema,
});

export const unitResearchReportRowSchema = baseReportRowSchema.extend({
  type: z.literal('unitResearch'),
  unit_id: unitIdSchema,
  village_name: z.string(),
  village_x: z.int(),
  village_y: z.int(),
});

export const unitImprovementReportRowSchema = baseReportRowSchema.extend({
  type: z.literal('unitImprovement'),
  unit_id: unitIdSchema,
  level: z.int().positive(),
  village_name: z.string(),
  village_x: z.int(),
  village_y: z.int(),
});

export const villageFoundedReportRowSchema = baseReportRowSchema.extend({
  type: z.literal('villageFounded'),
  origin_tile_id: tileIdSchema,
  target_tile_id: tileIdSchema,
  origin_name: z.string(),
  origin_x: z.int(),
  origin_y: z.int(),
  target_name: z.string(),
  target_x: z.int(),
  target_y: z.int(),
});

export const scheduledConstructionCancellationReportRowSchema =
  baseReportRowSchema.extend({
    type: z.literal('scheduledConstructionCancellation'),
    building_id: buildingIdSchema,
    field_id: z.int(),
    level: z.int().positive(),
    reason: scheduledConstructionCancellationReasonSchema,
    reason_detail_json: z.string(),
    village_name: z.string(),
    village_x: z.int(),
    village_y: z.int(),
  });

export const getReportsRowSchema = z
  .discriminatedUnion('type', [
    battleReportRowSchema,
    adventureReportRowSchema,
    movementReportRowSchema,
    tradeReportRowSchema,
    huntingPartyReportRowSchema,
    gatheringExpeditionReportRowSchema,
    scoutingReportRowSchema,
    unitResearchReportRowSchema,
    unitImprovementReportRowSchema,
    villageFoundedReportRowSchema,
    scheduledConstructionCancellationReportRowSchema,
  ])
  .meta({ id: 'GetReportsRow' });
