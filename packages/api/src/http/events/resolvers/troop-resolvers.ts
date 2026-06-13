import { getUnitDefinition } from '@pillage-first/game-assets/utils/units';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { updateVillageWheatProductionByTroopsAndVillageIdEffectQuery } from '../../../queries/effect-queries';
import {
  assessTroopCountQuestCompletion,
  assessUnitTroopCountQuestCompletion,
} from '../../../utils/quests';
import { updateVillageResourcesAt } from '../../../utils/village';
import type { Resolver } from '../resolver';

export const troopTrainingEventResolver: Resolver<
  GameEvent<'troopTraining'>
> = (database, args) => {
  const { unitId, villageId, resolvesAt } = args;
  const amount = 1;

  database.exec({
    sql: `
      WITH
        v AS (
          SELECT tile_id
          FROM
            villages
          WHERE
            id = $village_id
          )
      INSERT
      INTO
        troops (unit_id, amount, tile_id, source_tile_id)
      SELECT (
        SELECT id
        FROM unit_ids
        WHERE unit = $unit_id
        ), $amount, v.tile_id, v.tile_id
      FROM
        v
      WHERE
        TRUE ON CONFLICT(unit_id, tile_id, source_tile_id)
        DO
      UPDATE SET
        amount = amount + excluded.amount;
    `,
    bind: {
      $unit_id: unitId,
      $amount: amount,
      $village_id: villageId,
    },
  });

  const { unitWheatConsumption } = getUnitDefinition(unitId);

  database.exec({
    sql: updateVillageWheatProductionByTroopsAndVillageIdEffectQuery,
    bind: {
      $increase_amount: unitWheatConsumption,
      $village_id: villageId,
    },
  });

  updateVillageResourcesAt(database, villageId, resolvesAt);
  assessTroopCountQuestCompletion(database, resolvesAt);
  assessUnitTroopCountQuestCompletion(database, unitId, resolvesAt);

  return {
    affectedVillageIds: [villageId],
  };
};
