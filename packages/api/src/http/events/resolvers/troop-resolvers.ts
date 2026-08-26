import { getUnitDefinition } from '@pillage-first/game-assets/utils/units';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { updateWheatProductionByTroopsAndTileIdEffectQuery } from '../../../queries/effect-queries';
import {
  getVillageTileId,
  updateResourceSiteResourcesAt,
} from '../../../utils/village';
import type { Resolver } from '../resolver';

export const troopTrainingEventResolver: Resolver<
  GameEvent<'troopTraining'>
> = (database, args) => {
  const { unitId, villageId, resolvesAt } = args;
  const amount = 1;
  const tileId = getVillageTileId(database, villageId);

  database.exec({
    sql: `
      INSERT
      INTO
        troops (unit_id, amount, tile_id, source_tile_id)
      VALUES (
        (
          SELECT id
          FROM unit_ids
          WHERE unit = $unit_id
        ),
        $amount,
        $tile_id,
        $tile_id
      )
      ON CONFLICT(unit_id, tile_id, source_tile_id) DO UPDATE SET
        amount = amount + excluded.amount;
    `,
    bind: {
      $unit_id: unitId,
      $amount: amount,
      $tile_id: tileId,
    },
  });

  const { unitWheatConsumption } = getUnitDefinition(unitId);

  database.exec({
    sql: updateWheatProductionByTroopsAndTileIdEffectQuery,
    bind: {
      $increase_amount: unitWheatConsumption,
      $tile_id: tileId,
    },
  });

  updateResourceSiteResourcesAt(database, tileId, resolvesAt);

  return {
    affectedVillageIds: [villageId],
    affectedTileIds: [tileId],
  };
};
