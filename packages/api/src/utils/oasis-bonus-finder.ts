import type { z } from 'zod';
import type { ResourceFieldComposition } from '@pillage-first/types/models/resource-field-composition';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import {
  mapOwnedOasisRowToOasisOwnerDto,
  mapTileWithBonusesRowToDto,
  parseOasisOwnersJson,
} from '../http/controllers/mappers/oasis-finder-mapper';
import {
  getTilesWithBonusesRowSchema,
  type oasisBonusSlotSchema,
  ownedOasisRowSchema,
} from '../http/controllers/schemas/oasis-bonus-finder-schemas';
import {
  selectOwnedOasesQuery,
  selectTilesByOasisBonusesQuery,
  selectTilesByResourceFieldCompositionQuery,
} from '../queries/oasis-bonus-finder-queries';

type OwnedOasisRow = z.infer<typeof ownedOasisRowSchema>;
type TileWithBonusesRow = z.infer<typeof getTilesWithBonusesRowSchema>;
type OasisBonusSearchSlot = z.infer<typeof oasisBonusSlotSchema>;

type GetTilesWithBonusesArgs = {
  x: number;
  y: number;
  resourceFieldComposition: ResourceFieldComposition | 'any-cropper';
  bonuses: {
    firstOasis: OasisBonusSearchSlot;
    secondOasis: OasisBonusSearchSlot;
    thirdOasis: OasisBonusSearchSlot;
  };
};

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

export const getTilesWithBonuses = (
  database: DbFacade,
  { x, y, resourceFieldComposition, bonuses }: GetTilesWithBonusesArgs,
) => {
  const { firstOasis, secondOasis, thirdOasis } = bonuses;

  const requestedSlotBonuses = [
    ...firstOasis.map((bonus) => ({ slot: 1, ...bonus })),
    ...secondOasis.map((bonus) => ({ slot: 2, ...bonus })),
    ...thirdOasis.map((bonus) => ({ slot: 3, ...bonus })),
  ];

  if (requestedSlotBonuses.length === 0) {
    const rows = database.selectObjects({
      sql: selectTilesByResourceFieldCompositionQuery,
      bind: {
        $tile_x: x,
        $tile_y: y,
        $rfc_param: resourceFieldComposition,
      },
      schema: getTilesWithBonusesRowSchema,
    });

    const ownedOases = database.selectObjects({
      sql: selectOwnedOasesQuery,
      schema: ownedOasisRowSchema,
    });

    const ownedOasesByCoordinates = createOwnedOasesByCoordinates(ownedOases);

    return rows.map((row) => {
      const oasisOwners = getNearbyOwnedOasisOwners(
        row,
        ownedOasesByCoordinates,
      );

      return mapTileWithBonusesRowToDto(row, oasisOwners);
    });
  }

  const rows = database.selectObjects({
    sql: selectTilesByOasisBonusesQuery,
    bind: {
      $tile_x: x,
      $tile_y: y,
      $rfc_param: resourceFieldComposition,
      $requested_slot_bonuses: JSON.stringify(requestedSlotBonuses),
    },
    schema: getTilesWithBonusesRowSchema,
  });

  return rows.map((row) => {
    const oasisOwners = parseOasisOwnersJson(row.oasis_owners_json);

    return mapTileWithBonusesRowToDto(row, oasisOwners);
  });
};
