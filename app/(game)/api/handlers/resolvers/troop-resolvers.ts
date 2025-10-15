import type { Resolver } from 'app/interfaces/api';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { getUnitDefinition } from 'app/assets/utils/units';
import { updateVillageResourcesAt } from 'app/(game)/api/utils/village';

export const troopTrainingEventResolver: Resolver<
  GameEvent<'troopTraining'>
> = (database, args) => {
  const { unitId, villageId, resolvesAt } = args;

  database.exec(
    `
      WITH v AS (SELECT tile_id
                 FROM villages
                 WHERE id = $village_id)
      INSERT
      INTO troops (unit_id, amount, tile_id, source_tile_id)
      SELECT $unit_id, $amount, v.tile_id, v.tile_id
      FROM v
      WHERE TRUE
      ON CONFLICT(unit_id, tile_id, source_tile_id)
        DO UPDATE SET amount = amount + excluded.amount;
    `,
    {
      $unit_id: unitId,
      $amount: 1,
      $village_id: villageId,
    },
  );

  const { unitWheatConsumption } = getUnitDefinition(unitId);

  database.exec(
    `
      UPDATE effects
      SET value = value + $increase_amount
      WHERE effect_id = (SELECT id FROM effect_ids WHERE effect = 'wheatProduction')
        AND source = 'troops'
        AND village_id = $village_id;
    `,
    {
      $increase_amount: unitWheatConsumption,
      $village_id: villageId,
    },
  );

  updateVillageResourcesAt(database, villageId, resolvesAt);
};
