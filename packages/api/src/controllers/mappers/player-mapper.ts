import type { z } from 'zod';
import {
  playerVillageDtoSchema,
  playerVillageWithPopulationDtoSchema,
  sentReinforcementDtoSchema,
  villageTroopDtoSchema,
} from '@pillage-first/types/dtos/player';
import type {
  getPlayerVillagesWithPopulationSchema,
  getSentReinforcementsByVillageSchema,
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

export const mapSentReinforcement = (
  row: z.infer<typeof getSentReinforcementsByVillageSchema>,
): z.infer<typeof sentReinforcementDtoSchema> => {
  const dto = {
    village: playerVillageDtoSchema.parse({
      id: row.village_id,
      tileId: row.tile_id,
      coordinates: { x: row.coordinates_x, y: row.coordinates_y },
      name: row.name,
      slug: row.slug ?? `v-${row.village_id}`,
      resourceFieldComposition: row.resource_field_composition,
    }),
    troops: [
      mapVillageTroop({
        unit_id: row.unit_id,
        amount: row.amount,
        tile_id: row.tile_id,
        source_tile_id: row.source_tile_id,
      }),
    ],
  };

  return sentReinforcementDtoSchema.parse(dto);
};
