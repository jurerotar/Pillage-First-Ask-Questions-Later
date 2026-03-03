import { z } from 'zod';
import { resourceFieldCompositionSchema } from '@pillage-first/types/models/resource-field-composition';

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
  .transform((t) => {
    return {
      id: t.id,
      tileId: t.tile_id,
      coordinates: {
        x: t.coordinates_x,
        y: t.coordinates_y,
      },
      name: t.name,
      slug: t.slug ?? `v-${t.id}`,
      resourceFieldComposition: t.resource_field_composition,
    };
  })
  .pipe(
    z.strictObject({
      id: z.number(),
      tileId: z.number(),
      coordinates: z.strictObject({
        x: z.number(),
        y: z.number(),
      }),
      name: z.string(),
      slug: z.string(),
      resourceFieldComposition: resourceFieldCompositionSchema,
    }),
  )
  .meta({ id: 'GetVillagesByPlayer' });

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
  .transform((t) => {
    return {
      id: t.id,
      tileId: t.tile_id,
      coordinates: {
        x: t.coordinates_x,
        y: t.coordinates_y,
      },
      name: t.name,
      slug: t.slug ?? `v-${t.id}`,
      resourceFieldComposition: t.resource_field_composition,
      population: t.population,
    };
  })
  .pipe(
    z.strictObject({
      id: z.number(),
      tileId: z.number(),
      coordinates: z.strictObject({
        x: z.number(),
        y: z.number(),
      }),
      name: z.string(),
      slug: z.string(),
      resourceFieldComposition: resourceFieldCompositionSchema,
      population: z.number(),
    }),
  )
  .meta({ id: 'GetPlayerVillagesWithPopulation' });

export const getTroopsByVillageSchema = z
  .strictObject({
    unit_id: z.string(),
    amount: z.number().min(1),
    tile_id: z.number(),
    source_tile_id: z.number(),
  })
  .transform((t) => {
    return {
      unitId: t.unit_id,
      amount: t.amount,
      tileId: t.tile_id,
      source: t.source_tile_id,
    };
  })
  .pipe(
    z.strictObject({
      unitId: z.string(),
      amount: z.number(),
      tileId: z.number(),
      source: z.number(),
    }),
  )
  .meta({ id: 'GetTroopsByVillage' });
