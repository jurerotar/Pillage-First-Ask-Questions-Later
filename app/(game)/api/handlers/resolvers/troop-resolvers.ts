import type { Resolver } from 'app/interfaces/models/common';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import type { Troop } from 'app/interfaces/models/game/troop';
import {
  effectsCacheKey,
  troopsCacheKey,
  villagesCacheKey,
} from 'app/(game)/(village-slug)/constants/query-keys';
import { getUnitData } from 'app/(game)/(village-slug)/utils/units';
import { modifyTroops } from 'app/(game)/api/handlers/resolvers/utils/troops';
import type { Effect } from 'app/interfaces/models/game/effect';
import { isVillageEffect } from 'app/(game)/(village-slug)/hooks/guards/effect-guards';
import { updateVillageResourcesAt } from 'app/(game)/api/utils/village';
import type { Village } from 'app/interfaces/models/game/village';

export const troopTrainingEventResolver: Resolver<
  GameEvent<'troopTraining'>
> = async (queryClient, args) => {
  const { unitId, villageId, duration, startsAt } = args;

  const villages = queryClient.getQueryData<Village[]>([villagesCacheKey])!;
  const { tileId } = villages.find(({ id }) => id === villageId)!;

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

  updateVillageResourcesAt(queryClient, villageId, startsAt + duration);
};
