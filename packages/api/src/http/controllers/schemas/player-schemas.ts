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

export const getTroopsByVillageSchema = z
  .strictObject({
    unit_id: z.string(),
    amount: z.number().min(1),
    tile_id: z.number(),
    source_tile_id: z.number(),
  })
  .meta({ id: 'GetTroopsByVillageRow' });

export const getSentReinforcementsByVillageSchema = z
  .strictObject({
    village_id: z.number(),
    tile_id: z.number(),
    coordinates_x: z.number(),
    coordinates_y: z.number(),
    name: z.string(),
    slug: z.string().nullable(),
    resource_field_composition: resourceFieldCompositionSchema,
    unit_id: z.string(),
    amount: z.number().min(1),
    source_tile_id: z.number(),
  })
  .meta({ id: 'GetSentReinforcementsByVillageRow' });

export const returnSentReinforcementsSchema = z
  .strictObject({
    stationedTileId: z.number(),
    troops: z.array(
      z.strictObject({
        unitId: unitIdSchema,
        amount: z.number().int().min(1),
      }),
    ),
  })
  .meta({ id: 'ReturnSentReinforcements' });
