import { createEventFn } from 'app/(game)/(village-slug)/hooks/utils/events';
import { getBuildingData, specialFieldIds } from 'app/(game)/(village-slug)/utils/building';
import { newBuildingEffectFactory } from 'app/factories/effect-factory';
import type { Resolver } from 'app/interfaces/models/common';
import type { Effect } from 'app/interfaces/models/game/effect';
import type { Village } from 'app/interfaces/models/game/village';
import { effectsCacheKey, playerVillagesCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { isBuildingEffect } from 'app/(game)/(village-slug)/hooks/guards/effect-guards';

const updateBuildingFieldLevel = (villages: Village[], args: GameEvent<'buildingLevelChange'>): Village[] => {
  const { villageId, buildingFieldId, level } = args;

  return villages.map((village) => {
    if (village.id !== villageId) {
      return village;
    }
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
  });
};

const addBuildingField = (villages: Village[], args: GameEvent<'buildingConstruction'>): Village[] => {
  const { villageId, buildingFieldId, buildingId } = args;

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

export const removeBuildingField = (villages: Village[], args: GameEvent<'buildingDestruction'>): Village[] => {
  const { villageId, buildingFieldId } = args;

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
  const { buildingFieldId, level, buildingId } = args;

  const { effects } = getBuildingData(buildingId);

  queryClient.setQueryData<Effect[]>([effectsCacheKey], (prevData) => {
    const buildingEffects = prevData!.filter(isBuildingEffect);

    // Loop through all effects gained by the new level, find corresponding village effects and update them to the new values
    for (const { effectId, valuesPerLevel } of effects) {
      const villageEffect = buildingEffects.find((effect) => effect.id === effectId && effect?.buildingFieldId === buildingFieldId)!;
      villageEffect.value = valuesPerLevel[level];
    }
    return prevData;
  });

  queryClient.setQueryData<Village[]>([playerVillagesCacheKey], (villages) => {
    return updateBuildingFieldLevel(villages!, args);
  });
};

export const buildingConstructionResolver: Resolver<GameEvent<'buildingConstruction'>> = async (queryClient, args) => {
  const { villageId, buildingFieldId, buildingId } = args;

  const { effects } = getBuildingData(buildingId);

  queryClient.setQueryData<Effect[]>([effectsCacheKey], (prevData) => {
    const newEffects = effects.map(({ effectId, valuesPerLevel }) => {
      return newBuildingEffectFactory({ villageId, buildingFieldId, id: effectId, value: valuesPerLevel[0] });
    });
    return [...prevData!, ...newEffects];
  });

  queryClient.setQueryData<Village[]>([playerVillagesCacheKey], (villages) => {
    return addBuildingField(villages!, args);
  });
};

export const buildingDestructionResolver: Resolver<GameEvent<'buildingDestruction'>> = async (queryClient, args) => {
  const { buildingFieldId, villageId } = args;

  if (specialFieldIds.includes(buildingFieldId)) {
    await buildingLevelChangeResolver(queryClient, { ...args, resourceCost: [0, 0, 0, 0], level: 0 });
    return;
  }

  queryClient.setQueryData<Effect[]>([effectsCacheKey], (prevData) => {
    // Loop through all effects added by the building, find corresponding village effects and delete them
    return prevData!.filter((effect) => {
      return !(isBuildingEffect(effect) && effect.villageId === villageId && effect.buildingFieldId === buildingFieldId);
    });
  });

  queryClient.setQueryData<Village[]>([playerVillagesCacheKey], (villages) => {
    return removeBuildingField(villages!, args);
  });
};

export const buildingScheduledConstructionEventResolver: Resolver<GameEvent<'buildingScheduledConstruction'>> = async (
  queryClient,
  args,
) => {
  const { buildingId, buildingFieldId, level, resourceCost, villageId, startsAt, duration } = args;

  await createEventFn<'buildingLevelChange'>(queryClient, {
    type: 'buildingLevelChange',
    startsAt,
    duration,
    buildingId,
    buildingFieldId,
    level,
    villageId,
    resourceCost,
  });
};
