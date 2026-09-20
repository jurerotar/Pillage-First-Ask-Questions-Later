import type { z } from 'zod';
import type { ResourceFieldComposition } from '@pillage-first/types/models/resource-field-composition';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import {
  mapNearbyOasisRowToDto,
  mapTileWithBonusesRowToDto,
} from '../http/controllers/mappers/oasis-finder-mapper';
import {
  getTilesWithBonusesRowSchema,
  nearbyOasisRowSchema,
  type oasisBonusSlotSchema,
} from '../http/controllers/schemas/oasis-bonus-finder-schemas';
import {
  selectOccupiableOasesQuery,
  selectTilesByOasisBonusesQuery,
  selectTilesByResourceFieldCompositionQuery,
} from '../queries/oasis-bonus-finder-queries';

type NearbyOasisRow = z.infer<typeof nearbyOasisRowSchema>;
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
  showOccupiedTiles: boolean;
  onlyUseUnoccupiedOases: boolean;
};

export const createOasesByCoordinates = (oases: NearbyOasisRow[]) => {
  const oasesByCoordinates = new Map<string, NearbyOasisRow[]>();

  for (const oasis of oases) {
    const key = `${oasis.oasis_x},${oasis.oasis_y}`;
    const existingOases = oasesByCoordinates.get(key);

    if (existingOases) {
      existingOases.push(oasis);
    } else {
      oasesByCoordinates.set(key, [oasis]);
    }
  }

  return oasesByCoordinates;
};

export const getNearbyOases = (
  row: TileWithBonusesRow,
  oasesByCoordinates: Map<string, NearbyOasisRow[]>,
) => {
  const nearbyOases: NearbyOasisRow[] = [];

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
      const oases = oasesByCoordinates.get(`${oasisX},${oasisY}`) ?? [];
      nearbyOases.push(...oases);
    }
  }

  return nearbyOases
    .sort((a, b) => a.oasis_tile_id - b.oasis_tile_id)
    .map(mapNearbyOasisRowToDto);
};

export const getTilesWithBonuses = (
  database: DbFacade,
  {
    x,
    y,
    resourceFieldComposition,
    bonuses,
    showOccupiedTiles,
    onlyUseUnoccupiedOases,
  }: GetTilesWithBonusesArgs,
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
        $show_occupied_tiles: showOccupiedTiles ? 1 : 0,
      },
      schema: getTilesWithBonusesRowSchema,
    });

    const oases = database.selectObjects({
      sql: selectOccupiableOasesQuery,
      schema: nearbyOasisRowSchema,
    });

    const oasesByCoordinates = createOasesByCoordinates(oases);

    return rows.map((row) => {
      const nearbyOases = getNearbyOases(row, oasesByCoordinates);

      return mapTileWithBonusesRowToDto(row, nearbyOases);
    });
  }

  const rows = database.selectObjects({
    sql: selectTilesByOasisBonusesQuery,
    bind: {
      $tile_x: x,
      $tile_y: y,
      $rfc_param: resourceFieldComposition,
      $requested_slot_bonuses: JSON.stringify(requestedSlotBonuses),
      $show_occupied_tiles: showOccupiedTiles ? 1 : 0,
      $only_unoccupied_oases: onlyUseUnoccupiedOases ? 1 : 0,
    },
    schema: getTilesWithBonusesRowSchema,
  });

  const oases = database.selectObjects({
    sql: selectOccupiableOasesQuery,
    schema: nearbyOasisRowSchema,
  });

  const oasesByCoordinates = createOasesByCoordinates(oases);

  return rows.map((row) => {
    const nearbyOases = getNearbyOases(row, oasesByCoordinates);

    return mapTileWithBonusesRowToDto(row, nearbyOases);
  });
};
