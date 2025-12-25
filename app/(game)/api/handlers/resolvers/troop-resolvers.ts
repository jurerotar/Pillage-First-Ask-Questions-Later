import {
  effectsCacheKey,
  troopsCacheKey,
  villagesCacheKey,
} from 'app/(game)/(village-slug)/constants/query-keys';
import { modifyTroops } from 'app/(game)/api/handlers/resolvers/utils/troops';
import { updateVillageResourcesAt } from 'app/(game)/api/utils/village';
import { isVillageEffect } from 'app/(game)/guards/effect-guards';
import { getUnitDefinition } from 'app/assets/utils/units';
import type { Resolver } from 'app/interfaces/models/common';
import type { Effect } from 'app/interfaces/models/game/effect';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import type { Troop } from 'app/interfaces/models/game/troop';
import type { Village } from 'app/interfaces/models/game/village';

export const troopTrainingEventResolver: Resolver<
  GameEvent<'troopTraining'>
> = async (queryClient, args) => {
  const { unitId, villageId, duration, startsAt } = args;

  const villages = queryClient.getQueryData<Village[]>([villagesCacheKey])!;
  const { tileId } = villages.find(({ id }) => id === villageId)!;

  const { unitWheatConsumption } = getUnitDefinition(unitId);

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
