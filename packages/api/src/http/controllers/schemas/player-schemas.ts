import { z } from 'zod';
import { resourceFieldCompositionSchema } from '@pillage-first/types/models/resource-field-composition';
import { unitIdSchema } from '@pillage-first/types/models/unit';

export const getVillagesByPlayerSchema = z
  .strictObject({
    id: z.number(),
    tile_id: z.number(),
    coordinates_x: z.number(),
    coordinates_y: z.number(),
    name: z.string(),
    slug: z.string().nullable(),
    resource_field_composition: resourceFieldCompositionSchema,
  })
  .meta({ id: 'GetVillagesByPlayerRow' });

export const getPlayerVillagesWithPopulationSchema = z
  .strictObject({
    id: z.number(),
    tile_id: z.number(),
    coordinates_x: z.number(),
    coordinates_y: z.number(),
    name: z.string(),
    slug: z.string().nullable(),
    resource_field_composition: resourceFieldCompositionSchema,
    population: z.number(),
  })
  .meta({ id: 'GetPlayerVillagesWithPopulationRow' });

export const getStationedTroopsByTileSchema = z
  .strictObject({
    unit_id: z.string(),
    amount: z.number().min(1),
    tile_id: z.number(),
    source_tile_id: z.number(),
    source_tile_type: z.enum(['free', 'oasis']).nullable(),
  })
  .meta({ id: 'GetStationedTroopsByTileRow' });

export const getSentReinforcementsByTileSchema = z
  .strictObject({
    village_id: z.number(),
    target_type: z.enum(['village', 'oasis']),
    tile_id: z.number(),
    coordinates_x: z.number(),
    coordinates_y: z.number(),
    name: z.string(),
    slug: z.string().nullable(),
    resource_field_composition: resourceFieldCompositionSchema,
    unit_id: z.string(),
    amount: z.number().min(1),
    source_tile_id: z.number(),
    source_tile_type: z.enum(['free', 'oasis']).nullable(),
  })
  .meta({ id: 'GetSentReinforcementsByTileRow' });

export const sourceVillageRowSchema = z.strictObject({
  sourceVillageId: z.number().nullable(),
  sourceTileType: z.enum(['free', 'oasis']).nullable(),
  currentVillageId: z.number(),
  currentTileId: z.number(),
});

export const stationedVillageRowSchema = z.strictObject({
  currentVillageId: z.number(),
  currentTileId: z.number(),
  stationedTileType: z.enum(['free', 'oasis']).nullable(),
  stationedVillageId: z.number().nullable(),
});

export const coordinatesRowSchema = z.strictObject({
  x: z.number(),
  y: z.number(),
});

export const troopAmountSchema = z.number().nullable();

const reinforcementTileIdSchema = z.coerce.number().int().min(1);

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
