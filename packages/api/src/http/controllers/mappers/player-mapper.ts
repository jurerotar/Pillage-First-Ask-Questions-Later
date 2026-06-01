import type { z } from 'zod';
import {
  playerVillageDtoSchema,
  playerVillageWithPopulationDtoSchema,
  villageTroopDtoSchema,
} from '@pillage-first/types/dtos/player';
import type {
  getPlayerVillagesWithPopulationSchema,
  getTroopsByVillageSchema,
  getVillagesByPlayerSchema,
} from '../schemas/player-schemas';

export const mapPlayerVillage = (
  row: z.infer<typeof getVillagesByPlayerSchema>,
): z.infer<typeof playerVillageDtoSchema> => {
  const dto = {
    id: row.id,
    tileId: row.tile_id,
    coordinates: { x: row.coordinates_x, y: row.coordinates_y },
    name: row.name,
    slug: row.slug ?? `v-${row.id}`,
    resourceFieldComposition: row.resource_field_composition,
  };

  return playerVillageDtoSchema.parse(dto);
};

export const mapPlayerVillageWithPopulation = (
  row: z.infer<typeof getPlayerVillagesWithPopulationSchema>,
): z.infer<typeof playerVillageWithPopulationDtoSchema> => {
  const base = mapPlayerVillage(row);
  const dto = {
    ...base,
    population: row.population,
  };
  return playerVillageWithPopulationDtoSchema.parse(dto);
};

export const mapVillageTroop = (
  row: z.infer<typeof getTroopsByVillageSchema>,
): z.infer<typeof villageTroopDtoSchema> => {
  const dto = {
    unitId: row.unit_id,
    amount: row.amount,
    tileId: row.tile_id,
    source: row.source_tile_id,
  };
  return villageTroopDtoSchema.parse(dto);
};
