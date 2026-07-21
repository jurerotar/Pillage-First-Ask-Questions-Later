import type { DbFacade } from '@pillage-first/utils/facades/database';
import { oasisReinforcementToReturnSchema } from '../http/controllers/schemas/oasis-schemas';
import { selectOasisReinforcementsToReturnQuery } from '../queries/oasis-queries';
import {
  type ReinforcementTroopSelection,
  returnStationedTroops,
} from './reinforcements';

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
