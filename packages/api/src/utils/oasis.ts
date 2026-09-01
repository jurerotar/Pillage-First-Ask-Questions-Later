import { z } from 'zod';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { oasisReinforcementToReturnSchema } from '../http/controllers/schemas/oasis-schemas';
import {
  deleteOasisEffectsByTileIdQuery,
  insertOasisEffectsForVillageQuery,
  occupyOasisQuery,
  selectOasisOccupationContextQuery,
  selectOasisReinforcementsToReturnQuery,
} from '../queries/oasis-queries';
import {
  type ReinforcementTroopSelection,
  returnStationedTroops,
} from './reinforcements';
import { updateResourceSiteResourcesAt } from './village';

type OccupyOasisForVillageResult = {
  previousOwnerVillageId: number | null;
};

const oasisOccupationContextSchema = z.strictObject({
  village_tile_id: z.number(),
  previous_owner_village_id: z.number().nullable(),
  previous_owner_tile_id: z.number().nullable(),
});

export const occupyOasisForVillage = (
  db: DbFacade,
  villageId: number,
  oasisTileId: number,
  timestamp: number,
): OccupyOasisForVillageResult => {
  const {
    village_tile_id: villageTileId,
    previous_owner_village_id: previousOwnerVillageId,
    previous_owner_tile_id: previousOwnerTileId,
  } = db.selectObject({
    sql: selectOasisOccupationContextQuery,
    bind: {
      $village_id: villageId,
      $oasis_tile_id: oasisTileId,
    },
    schema: oasisOccupationContextSchema,
  })!;

  if (previousOwnerVillageId === villageId) {
    return { previousOwnerVillageId };
  }

  if (previousOwnerVillageId !== null) {
    updateResourceSiteResourcesAt(db, previousOwnerTileId!, timestamp);

    db.exec({
      sql: deleteOasisEffectsByTileIdQuery,
      bind: {
        $tile_id: previousOwnerTileId,
        $source_specifier: oasisTileId,
      },
    });
  }

  updateResourceSiteResourcesAt(db, villageTileId, timestamp);

  db.exec({
    sql: insertOasisEffectsForVillageQuery,
    bind: {
      $village_tile_id: villageTileId,
      $oasis_tile_id: oasisTileId,
    },
  });

  db.exec({
    sql: occupyOasisQuery,
    bind: {
      $oasis_tile_id: oasisTileId,
      $village_id: villageId,
    },
  });

  return { previousOwnerVillageId };
};

export const returnOasisReinforcements = (
  db: DbFacade,
  oasisId: number,
  owningVillageId: number,
  now: number,
) => {
  const troopsToReturn = db.selectObjects({
    sql: selectOasisReinforcementsToReturnQuery,
    bind: {
      $oasis_tile_id: oasisId,
      $village_id: owningVillageId,
    },
    schema: oasisReinforcementToReturnSchema,
  });

  const troopsBySourceTileId = new Map<
    number,
    {
      troops: ReinforcementTroopSelection[];
    }
  >();

  for (const troop of troopsToReturn) {
    if (troop.source_village_id === null) {
      throw new Error('Source village not found');
    }

    const sourceGroup = troopsBySourceTileId.get(troop.source_tile_id) ?? {
      troops: [],
    };

    sourceGroup.troops.push({
      amount: troop.amount,
      unitId: troop.unit_id,
    });

    troopsBySourceTileId.set(troop.source_tile_id, sourceGroup);
  }

  for (const [sourceTileId, { troops }] of troopsBySourceTileId) {
    returnStationedTroops(db, oasisId, sourceTileId, sourceTileId, troops, now);
  }
};
