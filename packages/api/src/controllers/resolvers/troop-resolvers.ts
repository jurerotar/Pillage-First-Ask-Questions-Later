import { getUnitDefinition } from '@pillage-first/game-assets/units/utils';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { Resolver } from '../../types/resolver';
import { assessTroopCountQuestCompletion } from '../../utils/quests';
import { updateVillageResourcesAt } from '../../utils/village';

export const troopTrainingEventResolver: Resolver<
  GameEvent<'troopTraining'>
> = (database, args) => {
  const { unitId, villageId, resolvesAt, amount } = args;

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
    sql: `
      UPDATE effects
      SET
        value = value + $increase_amount
      WHERE
        effect_id = (
          SELECT id
          FROM
            effect_ids
          WHERE
            effect = 'wheatProduction'
          )
        AND source = 'troops'
        AND village_id = $village_id;
    `,
    bind: {
      $increase_amount: unitWheatConsumption,
      $village_id: villageId,
    },
  });

  updateVillageResourcesAt(database, villageId, resolvesAt);
  assessTroopCountQuestCompletion(database, resolvesAt);
};
