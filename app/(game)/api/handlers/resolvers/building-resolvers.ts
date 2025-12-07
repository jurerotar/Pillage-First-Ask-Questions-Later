import {
  getBuildingDefinition,
  getBuildingDataForLevel,
  specialFieldIds,
} from 'app/assets/utils/buildings';
import { newBuildingEffectFactory } from 'app/factories/effect-factory';
import type { Resolver } from 'app/interfaces/models/common';
import type { Effect } from 'app/interfaces/models/game/effect';
import type { Village } from 'app/interfaces/models/game/village';
import {
  effectsCacheKey,
  villagesCacheKey,
} from 'app/(game)/(village-slug)/constants/query-keys';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { isBuildingEffect } from 'app/(game)/guards/effect-guards';
import { createEvent } from 'app/(game)/api/handlers/utils/create-event';
import { evaluateQuestCompletions } from 'app/(game)/api/utils/quests';

const updateBuildingFieldLevel = (
  villages: Village[],
  args: GameEvent<'buildingLevelChange'>,
): Village[] => {
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

const addBuildingField = (
  villages: Village[],
  args: GameEvent<'buildingConstruction'>,
): Village[] => {
  const { villageId, buildingFieldId, buildingId } = args;

  return villages.map((village) => {
    if (village.id === villageId) {
      return {
        ...village,
        buildingFields: [
          ...village.buildingFields,
          { id: buildingFieldId, buildingId, level: 0 },
        ],
      };
    }
    return village;
  });
};

export const removeBuildingField = (
  villages: Village[],
  args: GameEvent<'buildingDestruction'>,
): Village[] => {
  const { villageId, buildingFieldId } = args;

  return villages.map((village) => {
    if (village.id === villageId) {
      return {
        ...village,
        buildingFields: village.buildingFields.filter(
          ({ id }) => id !== buildingFieldId,
        ),
      };
    }
    return village;
  });
};

export const buildingLevelChangeResolver: Resolver<
  GameEvent<'buildingLevelChange'>
> = async (queryClient, args) => {
  const { buildingFieldId, level, buildingId, villageId, previousLevel } = args;

  const { effects: buildingEffects } = getBuildingDefinition(buildingId);

  queryClient.setQueryData<Effect[]>([effectsCacheKey], (prevData) => {
    const buildingEffectsWithoutCurrentBuildingEffects = prevData!.filter(
      (effect) => {
        return !(
          isBuildingEffect(effect) &&
          effect.villageId === villageId &&
          effect.buildingFieldId === buildingFieldId
        );
      },
    );

    const { population: currentPopulation } = getBuildingDataForLevel(
      buildingId,
      previousLevel,
    );
    const { population: nextPopulation } = getBuildingDataForLevel(
      buildingId,
      level,
    );

    const villagePopulationEffect =
      buildingEffectsWithoutCurrentBuildingEffects.find((effect) => {
        return (
          isBuildingEffect(effect) &&
          effect.villageId === villageId &&
          effect.buildingFieldId === 0 &&
          effect.id === 'wheatProduction'
        );
      })!;

    villagePopulationEffect.value += currentPopulation;
    villagePopulationEffect.value -= nextPopulation;

    return [
      ...buildingEffectsWithoutCurrentBuildingEffects,
      ...buildingEffects.map(({ effectId, valuesPerLevel, type }) => {
        return newBuildingEffectFactory({
          villageId,
          id: effectId,
          value: valuesPerLevel[level],
          buildingFieldId,
          buildingId,
          type,
        });
      }),
    ];
  });

  queryClient.setQueryData<Village[]>([villagesCacheKey], (villages) => {
    return updateBuildingFieldLevel(villages!, args);
  });

  evaluateQuestCompletions(queryClient);
};

export const buildingConstructionResolver: Resolver<
  GameEvent<'buildingConstruction'>
> = async (queryClient, args) => {
  const { villageId, buildingFieldId, buildingId } = args;

  const { effects } = getBuildingDefinition(buildingId);
  const { population } = getBuildingDataForLevel(buildingId, 0);

  queryClient.setQueryData<Effect[]>([effectsCacheKey], (prevData) => {
    const newEffects = effects.map(({ effectId, valuesPerLevel, type }) => {
      return newBuildingEffectFactory({
        id: effectId,
        villageId,
        value: valuesPerLevel[0],
        buildingFieldId,
        buildingId,
        type,
      });
    });

    const villagePopulationEffect = prevData!.find((effect) => {
      return (
        isBuildingEffect(effect) &&
        effect.villageId === villageId &&
        effect.buildingFieldId === 0 &&
        effect.id === 'wheatProduction'
      );
    })!;

    villagePopulationEffect.value += population;

    return [...prevData!, ...newEffects];
  });

  queryClient.setQueryData<Village[]>([villagesCacheKey], (villages) => {
    return addBuildingField(villages!, args);
  });

  await createEvent<'buildingLevelChange'>(queryClient, {
    ...args,
    type: 'buildingLevelChange',
  });
};

export const buildingDestructionResolver: Resolver<
  GameEvent<'buildingDestruction'>
> = async (queryClient, args) => {
  const { buildingFieldId, villageId, buildingId, previousLevel } = args;

  if (specialFieldIds.includes(buildingFieldId)) {
    await buildingLevelChangeResolver(queryClient, { ...args, level: 0 });
    return;
  }

  queryClient.setQueryData<Effect[]>([effectsCacheKey], (prevData) => {
    // Loop through all effects added by the building, find corresponding village effects and delete them
    const newFilters = prevData!.filter((effect) => {
      return !(
        isBuildingEffect(effect) &&
        effect.villageId === villageId &&
        effect.buildingFieldId === buildingFieldId
      );
    });

    const villagePopulationEffect = prevData!.find((effect) => {
      return (
        isBuildingEffect(effect) &&
        effect.villageId === villageId &&
        effect.buildingFieldId === 0 &&
        effect.id === 'wheatProduction'
      );
    })!;

    const { population } = getBuildingDataForLevel(buildingId, previousLevel);

    villagePopulationEffect.value += population;

    return newFilters;
  });

  queryClient.setQueryData<Village[]>([villagesCacheKey], (villages) => {
    return removeBuildingField(villages!, args);
  });
};

export const buildingScheduledConstructionEventResolver: Resolver<
  GameEvent<'buildingScheduledConstruction'>
> = async (queryClient, args) => {
  await createEvent<'buildingLevelChange'>(queryClient, {
    ...args,
    type: 'buildingLevelChange',
  });
};
