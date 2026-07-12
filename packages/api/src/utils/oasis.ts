import type { Tile } from '@pillage-first/types/models/tile';
import type { Village } from '@pillage-first/types/models/village';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { oasisReinforcementToReturnSchema } from '../http/controllers/schemas/oasis-schemas';
import {
  abandonOasisQuery,
  deleteOasisEffectsQuery,
  deleteOasisLoyaltyQuery,
  selectOasisReinforcementsToReturnQuery,
} from '../queries/oasis-queries';
import {
  type ReinforcementTroopSelection,
  returnStationedTroops,
} from './reinforcements';
import { updateVillageResourcesAt } from './village';

export const abandonOccupiedOasis = (
  database: DbFacade,
  villageId: Village['id'],
  oasisTileId: Tile['id'],
) => {
  const now = Date.now();

  updateVillageResourcesAt(database, villageId, now);

  returnOasisReinforcements(database, oasisTileId, villageId, now);

  database.exec({
    sql: deleteOasisEffectsQuery,
    bind: {
      $village_id: villageId,
      $source_specifier: oasisTileId,
    },
  });

  database.exec({
    sql: deleteOasisLoyaltyQuery,
    bind: {
      $tile_id: oasisTileId,
    },
  });

  database.exec({
    sql: abandonOasisQuery,
    bind: {
      $oasis_tile_id: oasisTileId,
      $village_id: villageId,
    },
  });
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
      sourceVillageId: number;
      troops: ReinforcementTroopSelection[];
    }
  >();

  for (const troop of troopsToReturn) {
    if (troop.source_village_id === null) {
      throw new Error('Source village not found');
    }

    const sourceGroup = troopsBySourceTileId.get(troop.source_tile_id) ?? {
      sourceVillageId: troop.source_village_id,
      troops: [],
    };

    sourceGroup.troops.push({
      amount: troop.amount,
      unitId: troop.unit_id,
    });
    troopsBySourceTileId.set(troop.source_tile_id, sourceGroup);
  }

  for (const [
    sourceTileId,
    { sourceVillageId, troops },
  ] of troopsBySourceTileId) {
    returnStationedTroops(
      db,
      sourceVillageId,
      oasisId,
      sourceTileId,
      sourceTileId,
      troops,
      now,
    );
  }
};
