import type { z } from 'zod';
import {
  oasisByAnimalsSearchResultItemDtoSchema,
  oasisByBonusSearchResultItemDtoSchema,
  type oasisByBonusSearchResultOasisDtoSchema,
} from '@pillage-first/types/dtos/oasis-search';
import { roundToNDecimalPoints } from '@pillage-first/utils/math';
import type { getOasesWithAnimalsRowSchema } from '../schemas/oasis-animal-finder-schemas';
import type {
  getTilesWithBonusesRowSchema,
  nearbyOasisRowSchema,
} from '../schemas/oasis-bonus-finder-schemas';

type OasisByBonusSearchResultOasisDto = z.infer<
  typeof oasisByBonusSearchResultOasisDtoSchema
>;

const dedupeOases = (oases: OasisByBonusSearchResultOasisDto[]) => {
  return [...new Map(oases.map((oasis) => [oasis.tileId, oasis])).values()];
};

export const mapOasisWithAnimalsRowToDto = (
  row: z.infer<typeof getOasesWithAnimalsRowSchema>,
) => {
  const bonuses = JSON.parse(row.bonuses_json);
  const animals = JSON.parse(row.animals_json);
  return oasisByAnimalsSearchResultItemDtoSchema.parse({
    tileId: row.tile_id,
    coordinates: { x: row.coordinates_x, y: row.coordinates_y },
    bonuses,
    animals,
    distance: roundToNDecimalPoints(Math.sqrt(row.distance_squared), 2),
  });
};

export const mapTileWithBonusesRowToDto = (
  row: z.infer<typeof getTilesWithBonusesRowSchema>,
  nearbyOases: OasisByBonusSearchResultOasisDto[],
) => {
  const ownerVillage =
    row.owner_village_id !== null &&
    row.owner_village_name !== null &&
    row.owner_village_x !== null &&
    row.owner_village_y !== null
      ? {
          id: row.owner_village_id,
          name: row.owner_village_name,
          slug: row.owner_village_slug,
          coordinates: {
            x: row.owner_village_x,
            y: row.owner_village_y,
          },
        }
      : null;

  return oasisByBonusSearchResultItemDtoSchema.parse({
    tileId: row.tile_id,
    coordinates: { x: row.coordinates_x, y: row.coordinates_y },
    resourceFieldComposition: row.resource_field_composition,
    ownerVillage,
    nearbyOases: dedupeOases(nearbyOases),
    distance: roundToNDecimalPoints(Math.sqrt(row.distance_squared), 2),
  });
};

export const mapNearbyOasisRowToDto = (
  row: z.infer<typeof nearbyOasisRowSchema>,
): OasisByBonusSearchResultOasisDto => {
  return {
    tileId: row.oasis_tile_id,
    coordinates: {
      x: row.oasis_x,
      y: row.oasis_y,
    },
    oasisGraphics: row.oasis_graphics,
    isOccupied: row.is_occupied === 1,
  };
};
