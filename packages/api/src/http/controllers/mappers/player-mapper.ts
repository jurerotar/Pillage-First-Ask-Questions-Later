import type { z } from 'zod';
import {
  playerVillageDtoSchema,
  playerVillageWithPopulationDtoSchema,
  sentReinforcementDtoSchema,
  villageTroopDtoSchema,
  woundedTroopDtoSchema,
} from '@pillage-first/types/dtos/player';
import type {
  getPlayerVillagesWithPopulationSchema,
  getSentReinforcementsByTileSchema,
  getStationedTroopsByTileSchema,
  getVillagesByPlayerSchema,
  getWoundedTroopsByVillageSchema,
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
  row: z.infer<typeof getStationedTroopsByTileSchema>,
): z.infer<typeof villageTroopDtoSchema> => {
  const dto = {
    unitId: row.unit_id,
    amount: row.amount,
    tileId: row.tile_id,
    source: row.source_tile_id,
    sourceTileType: row.source_tile_type,
  };
  return villageTroopDtoSchema.parse(dto);
};

export const mapWoundedTroop = (
  row: z.infer<typeof getWoundedTroopsByVillageSchema>,
): z.infer<typeof woundedTroopDtoSchema> => {
  return woundedTroopDtoSchema.parse({
    unitId: row.unit_id,
    amount: row.amount,
    updatedAt: row.updated_at,
  });
};

export const mapSentReinforcement = (
  row: z.infer<typeof getSentReinforcementsByTileSchema>,
): z.infer<typeof sentReinforcementDtoSchema> => {
  const dto = {
    targetType: row.target_type,
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
        source_tile_type: row.source_tile_type,
      }),
    ],
  };

  return sentReinforcementDtoSchema.parse(dto);
};

export const mapSentReinforcements = (
  rows: z.infer<typeof getSentReinforcementsByTileSchema>[],
): z.infer<typeof sentReinforcementDtoSchema>[] => {
  const groupedReinforcements = new Map<
    number,
    z.infer<typeof sentReinforcementDtoSchema>
  >();

  for (const row of rows) {
    const mapped = mapSentReinforcement(row);
    const existing = groupedReinforcements.get(mapped.village.tileId);

    if (existing) {
      existing.troops.push(...mapped.troops);
      continue;
    }

    groupedReinforcements.set(mapped.village.tileId, mapped);
  }

  return [...groupedReinforcements.values()];
};
