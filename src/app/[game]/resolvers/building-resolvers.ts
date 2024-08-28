import { villagesCacheKey } from 'app/[game]/hooks/use-villages';
import { specialFieldIds } from 'app/[game]/utils/building';
import type { Resolver } from 'interfaces/models/common';
import type { GameEventType } from 'interfaces/models/events/game-event';
import type { BuildingId } from 'interfaces/models/game/building';
import type { BuildingField, Village } from 'interfaces/models/game/village';
import type { Effect } from 'interfaces/models/game/effect';
import { effectsCacheKey } from 'app/[game]/hooks/use-effects';
import { newBuildingEffectFactory } from 'app/factories/effect-factory';

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

const removeBuildingField = (villages: Village[], villageId: Village['id'], buildingFieldId: BuildingField['id']): Village[] => {
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

export const buildingLevelChangeResolver: Resolver<GameEventType.BUILDING_LEVEL_CHANGE> = async (args, queryClient) => {
  const { villageId, buildingFieldId, level, building } = args;

  queryClient.setQueryData<Effect[]>([effectsCacheKey], (prevData) => {
    for (const { effectId, valuesPerLevel } of building.effects) {
      prevData!.find((effect) => effect.scope === 'village' && effect.id === effectId && effect.source === 'building')!.value =
        valuesPerLevel[level];
    }
    return prevData;
  });

  queryClient.setQueryData<Village[]>([villagesCacheKey], (prevData) => {
    return updateBuildingFieldLevel(prevData!, villageId, buildingFieldId, level);
  });
};

export const buildingConstructionResolver: Resolver<GameEventType.BUILDING_CONSTRUCTION> = async (args, queryClient) => {
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

export const buildingDestructionResolver: Resolver<GameEventType.BUILDING_DESTRUCTION> = async (args, queryClient) => {
  const { villageId, buildingFieldId } = args;

  if (specialFieldIds.includes(buildingFieldId)) {
    await buildingLevelChangeResolver({ ...args, resourceCost: [0, 0, 0, 0], level: 0 }, queryClient);
    return;
  }

  queryClient.setQueryData<Village[]>([villagesCacheKey], (prevData) => {
    return removeBuildingField(prevData!, villageId, buildingFieldId);
  });
};
