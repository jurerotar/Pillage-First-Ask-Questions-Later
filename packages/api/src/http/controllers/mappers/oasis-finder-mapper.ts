import { z } from 'zod';
import {
  oasisByAnimalsSearchResultItemDtoSchema,
  oasisByBonusSearchResultItemDtoSchema,
  oasisOwnerDtoSchema,
} from '@pillage-first/types/dtos/oasis-search';
import { roundToNDecimalPoints } from '@pillage-first/utils/math';
import type { getOasesWithAnimalsRowSchema } from '../schemas/oasis-animal-finder-schemas';
import type {
  getTilesWithBonusesRowSchema,
  ownedOasisRowSchema,
} from '../schemas/oasis-bonus-finder-schemas';

type OasisOwnerDto = z.infer<typeof oasisOwnerDtoSchema>;

const dedupeOasisOwners = (oasisOwners: OasisOwnerDto[]) => {
  return [
    ...new Map(oasisOwners.map((owner) => [owner.oasisTileId, owner])).values(),
  ];
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
  oasisOwners: OasisOwnerDto[],
) => {
  return oasisByBonusSearchResultItemDtoSchema.parse({
    tileId: row.tile_id,
    coordinates: { x: row.coordinates_x, y: row.coordinates_y },
    resourceFieldComposition: row.resource_field_composition,
    oasisOwners: dedupeOasisOwners(oasisOwners),
    distance: roundToNDecimalPoints(Math.sqrt(row.distance_squared), 2),
  });
};

export const mapOwnedOasisRowToOasisOwnerDto = (
  row: z.infer<typeof ownedOasisRowSchema>,
): OasisOwnerDto => {
  return {
    oasisTileId: row.oasis_tile_id,
    ownerVillage: {
      id: row.owner_village_id,
      name: row.owner_village_name,
      slug: row.owner_village_slug,
      coordinates: {
        x: row.owner_village_x,
        y: row.owner_village_y,
      },
    },
  };
};

export const parseOasisOwnersJson = (
  oasisOwnersJson: string,
): OasisOwnerDto[] => {
  return z.array(oasisOwnerDtoSchema).parse(JSON.parse(oasisOwnersJson));
};
