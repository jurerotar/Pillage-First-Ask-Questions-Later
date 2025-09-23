import type { Resolver } from 'app/interfaces/api';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import type { Troop } from 'app/interfaces/models/game/troop';
import {
  effectsCacheKey,
  troopsCacheKey,
} from 'app/(game)/(village-slug)/constants/query-keys';
import { getUnitData } from 'app/(game)/(village-slug)/utils/units';
import { modifyTroops } from 'app/(game)/api/handlers/resolvers/utils/troops';
import type { Effect } from 'app/interfaces/models/game/effect';
import { isVillageEffect } from 'app/(game)/(village-slug)/hooks/guards/effect-guards';
import { updateVillageResourcesAt } from 'app/(game)/api/utils/village';

export const troopTrainingEventResolver: Resolver<
  GameEvent<'troopTraining'>
> = async (queryClient, database, args) => {
  const { unitId, villageId, tileId, duration, startsAt } = args;

  database.exec({
    sql: `
      INSERT INTO troops (unit_id, amount, tile_id, source)
      VALUES ($unit_id,
              $amount,
              (SELECT tile_id FROM villages WHERE id = $village_id),
              (SELECT tile_id FROM villages WHERE id = $village_id))
      ON CONFLICT(unit_id, tile_id, source)
        DO UPDATE SET amount = amount + excluded.amount;
    `,
    bind: {
      $unit_id: unitId,
      $amount: 1,
      $village_id: villageId,
    },
  });

  const { unitWheatConsumption } = getUnitData(unitId);

  const troopsToAdd: Troop[] = [
    {
      tileId,
      source: tileId,
      unitId,
      amount: 1,
    },
  ];

  queryClient.setQueryData<Troop[]>([troopsCacheKey], (troops) => {
    return modifyTroops(troops!, troopsToAdd, 'add');
  });

  queryClient.setQueryData<Effect[]>([effectsCacheKey], (effects) => {
    const troopConsumptionEffect = effects!.find(
      (effect) =>
        isVillageEffect(effect) &&
        effect.villageId === villageId &&
        effect.source === 'troops',
    )!;
    troopConsumptionEffect.value += unitWheatConsumption;
    return effects;
  });

  updateVillageResourcesAt(
    queryClient,
    database,
    villageId,
    startsAt + duration,
  );
};
