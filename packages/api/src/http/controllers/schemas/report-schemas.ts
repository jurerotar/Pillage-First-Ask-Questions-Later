import { z } from 'zod';
import {
  reportOutcomeSchema,
  reportTagSchema,
  reportTypeSchema,
} from '@pillage-first/types/models/report';
import { tribeSchema } from '@pillage-first/types/models/tribe';

export const getReportListingsRowSchema = z.strictObject({
  id: z.int(),
  player_id: z.int(),
  village_id: z.int(),
  timestamp: z.int(),
  type: reportTypeSchema,
  outcome: reportOutcomeSchema,
  summary_json: z.string(),
  tags_json: z.string(),
});

const nullableReportDetailColumns = {
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
  movement_origin_tile_id: z.int().nullable(),
  movement_target_tile_id: z.int().nullable(),
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
  trade_origin_tile_id: z.int().nullable(),
  trade_target_tile_id: z.int().nullable(),
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
  trade_wood: z.int().nullable(),
  trade_clay: z.int().nullable(),
  trade_iron: z.int().nullable(),
  trade_wheat: z.int().nullable(),
};

const baseReportRowSchema = z.strictObject({
  id: z.int(),
  player_id: z.int(),
  village_id: z.int(),
  timestamp: z.int(),
  outcome: reportOutcomeSchema,
  tag: reportTagSchema.nullable(),
  ...nullableReportDetailColumns,
});

const battleReportRowSchema = baseReportRowSchema.extend({
  type: z.literal('battle'),
  battle_is_raid: z.int(),
  battle_origin_name: z.string(),
  battle_origin_x: z.int(),
  battle_origin_y: z.int(),
  battle_target_name: z.string(),
  battle_target_x: z.int(),
  battle_target_y: z.int(),
});

const adventureReportRowSchema = baseReportRowSchema.extend({
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

const movementReportRowSchema = baseReportRowSchema.extend({
  type: z.literal('movement'),
  movement_id: z.int(),
  movement_type: z.enum(['reinforcement', 'relocation']),
  movement_tribe: tribeSchema,
  movement_origin_tile_id: z.int(),
  movement_target_tile_id: z.int(),
  movement_origin_player_name: z.string(),
  movement_origin_player_slug: z.string(),
  movement_origin_name: z.string(),
  movement_origin_x: z.int(),
  movement_origin_y: z.int(),
  movement_target_name: z.string(),
  movement_target_x: z.int(),
  movement_target_y: z.int(),
});

const tradeReportRowSchema = baseReportRowSchema.extend({
  type: z.literal('trade'),
  trade_id: z.int(),
  trade_origin_tile_id: z.int(),
  trade_target_tile_id: z.int(),
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
  trade_wood: z.int(),
  trade_clay: z.int(),
  trade_iron: z.int(),
  trade_wheat: z.int(),
});

export const getReportsRowSchema = z
  .discriminatedUnion('type', [
    battleReportRowSchema,
    adventureReportRowSchema,
    movementReportRowSchema,
    tradeReportRowSchema,
  ])
  .meta({ id: 'GetReportsRow' });
