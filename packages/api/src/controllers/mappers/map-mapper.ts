import type { z } from 'zod';
import {
  mapMarkerDtoSchema,
  mapTileDtoSchema,
  mapTileOasisBonusDtoSchema,
  mapTileTroopDtoSchema,
  mapTileWorldItemDtoSchema,
} from '@pillage-first/types/dtos/map';
import type {
  getMapMarkersSchema,
  getTileOasisBonusesSchema,
  getTilesSchema,
  getTileTroopsSchema,
  getTileWorldItemSchema,
} from '../schemas/map-schemas';

export const mapTile = (
  row: z.infer<typeof getTilesSchema>,
): z.infer<typeof mapTileDtoSchema> => {
  const isOccupiableTile = row.type === 'free';
  const isOccupied = row.player_id !== null;

  // Compute owner and ownerVillage consistently
  const owner = isOccupied
    ? row.player_id !== null &&
      row.player_name !== null &&
      row.player_tribe !== null &&
      row.player_faction !== null
      ? {
          id: row.player_id,
          name: row.player_name,
          slug: row.player_slug ?? '',
          tribe: row.player_tribe,
          faction: row.player_faction,
        }
      : null
    : null;

  const ownerVillage = isOccupied
    ? row.village_id !== null &&
      row.village_name !== null &&
      row.population !== null
      ? {
          id: row.village_id,
          name: row.village_name,
          slug: row.village_slug ?? '',
          population: row.population,
        }
      : null
    : null;

  if (isOccupiableTile) {
    const dto = {
      id: row.id,
      type: 'free' as const,
      coordinates: { x: row.coordinates_x, y: row.coordinates_y },
      owner,
      ownerVillage,
      attributes: {
        // RFC should be present for free tiles; coalesce to a valid default if missing
        resourceFieldComposition: row.rfc ?? '4446',
      },
      item: row.item_id === null ? null : { id: row.item_id },
    };
    return mapTileDtoSchema.parse(dto);
  }

  const dto = {
    id: row.id,
    type: 'oasis' as const,
    coordinates: { x: row.coordinates_x, y: row.coordinates_y },
    owner,
    ownerVillage,
    attributes: {
      oasisGraphics: row.oasis_graphics ?? 0,
      isOccupiable: row.oasis_is_occupiable === 1,
    },
  };

  return mapTileDtoSchema.parse(dto);
};

export const mapTileTroop = (
  row: z.infer<typeof getTileTroopsSchema>,
): z.infer<typeof mapTileTroopDtoSchema> => {
  const dto = {
    unitId: row.unit_id,
    amount: row.amount,
    tileId: row.tile_id,
    source: row.source_tile_id,
  };
  return mapTileTroopDtoSchema.parse(dto);
};

export const mapTileOasisBonus = (
  row: z.infer<typeof getTileOasisBonusesSchema>,
): z.infer<typeof mapTileOasisBonusDtoSchema> => {
  return mapTileOasisBonusDtoSchema.parse({
    resource: row.resource,
    bonus: row.bonus,
  });
};

export const mapTileWorldItem = (
  row: z.infer<typeof getTileWorldItemSchema>,
): z.infer<typeof mapTileWorldItemDtoSchema> => {
  return mapTileWorldItemDtoSchema.parse({
    id: row.item_id,
    coordinates: { x: 0, y: 0 },
    distance: 0,
    amount: row.amount,
  });
};

export const mapMarker = (
  row: z.infer<typeof getMapMarkersSchema>,
): z.infer<typeof mapMarkerDtoSchema> => {
  return mapMarkerDtoSchema.parse({ tileId: row.tile_id });
};
