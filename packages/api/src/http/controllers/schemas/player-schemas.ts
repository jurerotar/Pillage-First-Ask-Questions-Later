import { z } from 'zod';
import { resourceFieldCompositionSchema } from '@pillage-first/types/models/resource-field-composition';
import { tileIdSchema, tileTypeSchema } from '@pillage-first/types/models/tile';
import { unitIdSchema } from '@pillage-first/types/models/unit';

export const getVillagesByPlayerSchema = z
  .strictObject({
    id: z.number(),
    tile_id: tileIdSchema,
    coordinates_x: z.number(),
    coordinates_y: z.number(),
    name: z.string(),
    slug: z.string().nullable(),
    population: z.number(),
    resource_field_composition: resourceFieldCompositionSchema,
  })
  .meta({ id: 'GetVillagesByPlayerRow' });

export const getPlayerVillagesWithPopulationSchema = z
  .strictObject({
    id: z.number(),
    tile_id: tileIdSchema,
    coordinates_x: z.number(),
    coordinates_y: z.number(),
    name: z.string(),
    slug: z.string().nullable(),
    resource_field_composition: resourceFieldCompositionSchema,
    population: z.number(),
    occupied_oasis_json: z.string(),
  })
  .meta({ id: 'GetPlayerVillagesWithPopulationRow' });

export const getStationedTroopsByTileSchema = z
  .strictObject({
    can_relocate: z.union([z.literal(0), z.literal(1)]),
    unit_id: unitIdSchema,
    amount: z.number().min(1),
    tile_id: tileIdSchema,
    source_tile_id: tileIdSchema,
    source_tile_type: tileTypeSchema.nullable(),
  })
  .meta({ id: 'GetStationedTroopsByTileRow' });

export const getVillageUnitCountSchema = z
  .strictObject({
    at_home: z.number().min(0),
    in_transit: z.number().min(0),
    stationed_away: z.number().min(0),
  })
  .meta({ id: 'GetVillageUnitCountRow' });

export const getWoundedTroopsByVillageSchema = z
  .strictObject({
    unit_id: unitIdSchema,
    amount: z.number().min(1),
    updated_at: z.number(),
  })
  .meta({ id: 'GetWoundedTroopsByVillageRow' });

export const getSentReinforcementsByTileSchema = z
  .strictObject({
    can_relocate: z.union([z.literal(0), z.literal(1)]),
    village_id: z.number(),
    target_type: z.enum(['village', 'oasis']),
    tile_id: tileIdSchema,
    coordinates_x: z.number(),
    coordinates_y: z.number(),
    name: z.string(),
    slug: z.string().nullable(),
    resource_field_composition: resourceFieldCompositionSchema,
    unit_id: unitIdSchema,
    amount: z.number().min(1),
    source_tile_id: tileIdSchema,
    source_tile_type: tileTypeSchema.nullable(),
  })
  .meta({ id: 'GetSentReinforcementsByTileRow' });

export const sourceVillageRowSchema = z.strictObject({
  sourcePlayerId: z.number().nullable(),
  currentPlayerId: z.number(),
  sourceVillageId: z.number().nullable(),
  sourceTileType: tileTypeSchema.nullable(),
  currentVillageId: z.number(),
  currentTileId: tileIdSchema,
});

export const stationedVillageRowSchema = z.strictObject({
  stationedPlayerId: z.number().nullable(),
  currentPlayerId: z.number(),
  currentVillageId: z.number(),
  currentTileId: tileIdSchema,
  stationedTileType: tileTypeSchema.nullable(),
  stationedVillageId: z.number().nullable(),
});

export const troopAmountSchema = z.number().nullable();

const reinforcementTileIdSchema = z.coerce.number().pipe(tileIdSchema);

const reinforcementTroopsSchema = z
  .array(
    z.strictObject({
      unitId: unitIdSchema,
      amount: z.number().int().min(1),
    }),
  )
  .min(1);

export const returnSentReinforcementsSchema = z
  .strictObject({
    stationedTileId: reinforcementTileIdSchema,
    troops: reinforcementTroopsSchema,
  })
  .meta({ id: 'ReturnSentReinforcements' });

export const relocateReinforcementsSchema = z
  .strictObject({
    sourceTileId: reinforcementTileIdSchema,
    troops: reinforcementTroopsSchema,
  })
  .meta({ id: 'RelocateReinforcements' });

export const returnReinforcementsSchema = z
  .strictObject({
    sourceTileId: reinforcementTileIdSchema,
    troops: reinforcementTroopsSchema,
  })
  .meta({ id: 'ReturnReinforcements' });

export const relocateSentReinforcementsSchema = z
  .strictObject({
    stationedTileId: reinforcementTileIdSchema,
    troops: reinforcementTroopsSchema,
  })
  .meta({ id: 'RelocateSentReinforcements' });
