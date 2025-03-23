import { createEventFn } from 'app/(game)/hooks/utils/events';
import { specialFieldIds } from 'app/(game)/utils/building';
import { newBuildingEffectFactory } from 'app/factories/effect-factory';
import type { Resolver } from 'app/interfaces/models/common';
import type { BuildingId } from 'app/interfaces/models/game/building';
import type { Effect } from 'app/interfaces/models/game/effect';
import type { BuildingField, Village } from 'app/interfaces/models/game/village';
import { effectsCacheKey, villagesCacheKey } from 'app/(game)/constants/query-keys';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { isBuildingEffect } from 'app/(game)/hooks/guards/effect-guards';

const updateBuildingFieldLevel = (
  villages: Village[],
  villageId: Village['id'],
  buildingFieldId: BuildingField['id'],
  level: number,
): Village[] => {
  return villages.map((village) => {
    if (village.id === villageId) {
      return {
        ...village,
        buildingFields: village.buildingFields.map((buildingField) => {
          if (buildingField.id === buildingFieldId) {
            return {
              ...buildingField,
              level,
            };
          }
          return buildingField;
        }),
      };
    }
    return village;
  });
};

const addBuildingField = (
  villages: Village[],
  villageId: Village['id'],
  buildingFieldId: BuildingField['id'],
  buildingId: BuildingId,
): Village[] => {
  return villages.map((village) => {
    if (village.id === villageId) {
      return {
        ...village,
        buildingFields: [...village.buildingFields, { id: buildingFieldId, buildingId, level: 0 }],
      };
    }
    return village;
  });
};

export const removeBuildingField = (villages: Village[], villageId: Village['id'], buildingFieldId: BuildingField['id']): Village[] => {
  return villages.map((village) => {
    if (village.id === villageId) {
      return {
        ...village,
        buildingFields: village.buildingFields.filter(({ id }) => id !== buildingFieldId),
      };
    }
    return village;
  });
};

export const buildingLevelChangeResolver: Resolver<GameEvent<'buildingLevelChange'>> = async (queryClient, args) => {
  const { villageId, buildingFieldId, level, building } = args;

  queryClient.setQueryData<Effect[]>([effectsCacheKey], (prevData) => {
    const buildingEffects = prevData!.filter(isBuildingEffect);

    // Loop through all effects gained by the new level, find corresponding village effects and update them to the new values
    for (const { effectId, valuesPerLevel } of building.effects) {
      const villageEffect = buildingEffects.find((effect) => effect.id === effectId && effect?.buildingFieldId === buildingFieldId)!;
      villageEffect.value = valuesPerLevel[level];
    }
    return prevData;
  });

  queryClient.setQueryData<Village[]>([villagesCacheKey], (prevData) => {
    return updateBuildingFieldLevel(prevData!, villageId, buildingFieldId, level);
  });
};

export const buildingConstructionResolver: Resolver<GameEvent<'buildingConstruction'>> = async (queryClient, args) => {
  const { villageId, buildingFieldId, building } = args;
  const { id: buildingId } = building;

  queryClient.setQueryData<Effect[]>([effectsCacheKey], (prevData) => {
    const newEffects = building.effects.map(({ effectId, valuesPerLevel }) => {
      return newBuildingEffectFactory({ villageId, buildingFieldId, id: effectId, value: valuesPerLevel[0] });
    });
    return [...prevData!, ...newEffects];
  });

  queryClient.setQueryData<Village[]>([villagesCacheKey], (prevData) => {
    return addBuildingField(prevData!, villageId, buildingFieldId, buildingId);
  });
};

export const buildingDestructionResolver: Resolver<GameEvent<'buildingDestruction'>> = async (queryClient, args) => {
  const { villageId, buildingFieldId } = args;

  if (specialFieldIds.includes(buildingFieldId)) {
    await buildingLevelChangeResolver(queryClient, { ...args, resourceCost: [0, 0, 0, 0], level: 0 });
    return;
  }

  queryClient.setQueryData<Village[]>([villagesCacheKey], (prevData) => {
    return removeBuildingField(prevData!, villageId, buildingFieldId);
  });
};

export const buildingScheduledConstructionEventResolver: Resolver<GameEvent<'buildingScheduledConstruction'>> = async (
  queryClient,
  args,
) => {
  const { building, buildingFieldId, level, resourceCost, villageId, startsAt, duration } = args;

  await createEventFn<'buildingLevelChange'>(queryClient, {
    type: 'buildingLevelChange',
    startsAt,
    duration,
    building,
    buildingFieldId,
    level,
    villageId,
    resourceCost,
  });
};
