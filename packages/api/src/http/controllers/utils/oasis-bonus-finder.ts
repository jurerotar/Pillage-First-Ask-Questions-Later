import type { z } from 'zod';
import { mapOwnedOasisRowToOasisOwnerDto } from '../mappers/oasis-finder-mapper';
import type {
  getTilesWithBonusesRowSchema,
  ownedOasisRowSchema,
} from '../schemas/oasis-bonus-finder-schemas';

type OwnedOasisRow = z.infer<typeof ownedOasisRowSchema>;
type TileWithBonusesRow = z.infer<typeof getTilesWithBonusesRowSchema>;

export const createOwnedOasesByCoordinates = (ownedOases: OwnedOasisRow[]) => {
  const ownedOasesByCoordinates = new Map<string, OwnedOasisRow[]>();

  for (const oasis of ownedOases) {
    const key = `${oasis.oasis_x},${oasis.oasis_y}`;
    const existingOases = ownedOasesByCoordinates.get(key);

    if (existingOases) {
      existingOases.push(oasis);
    } else {
      ownedOasesByCoordinates.set(key, [oasis]);
    }
  }

  return ownedOasesByCoordinates;
};

export const getNearbyOwnedOasisOwners = (
  row: TileWithBonusesRow,
  ownedOasesByCoordinates: Map<string, OwnedOasisRow[]>,
) => {
  const nearbyOwnedOases: OwnedOasisRow[] = [];

  for (
    let oasisX = row.coordinates_x - 3;
    oasisX <= row.coordinates_x + 3;
    oasisX += 1
  ) {
    for (
      let oasisY = row.coordinates_y - 3;
      oasisY <= row.coordinates_y + 3;
      oasisY += 1
    ) {
      const oases = ownedOasesByCoordinates.get(`${oasisX},${oasisY}`) ?? [];
      nearbyOwnedOases.push(...oases);
    }
  }

  return nearbyOwnedOases
    .sort((a, b) => a.oasis_tile_id - b.oasis_tile_id)
    .map(mapOwnedOasisRowToOasisOwnerDto);
};
