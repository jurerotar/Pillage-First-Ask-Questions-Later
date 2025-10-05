import type { Resolver } from 'app/interfaces/api';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { getUnitDefinition } from 'app/assets/utils/units';
import { updateVillageResourcesAt } from 'app/(game)/api/utils/village';

export const troopTrainingEventResolver: Resolver<
  GameEvent<'troopTraining'>
> = async (_queryClient, database, args) => {
  const { unitId, villageId, duration, startsAt } = args;

  database.transaction((db) => {
    db.exec(
      `
        WITH v AS (SELECT tile_id
                   FROM villages
                   WHERE id = $village_id)
        INSERT
        INTO troops (unit_id, amount, tile_id, source_tile_id)
        SELECT $unit_id, $amount, v.tile_id, v.tile_id
        FROM v
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

    db.exec(
      `
        UPDATE effects
        SET value = value + $increase
        WHERE effect_id = 'wheatProduction'
          AND source = 'troops'
          AND village_id = $village_id;
      `,
      {
        $increase_amount: unitWheatConsumption,
        $village_id: villageId,
      },
    );

    updateVillageResourcesAt(db, villageId, startsAt + duration);
  });
};
