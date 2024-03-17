import { BuildingField, Village } from 'interfaces/models/game/village';
import { villagesCacheKey } from 'app/[game]/hooks/use-villages';
import { database } from 'database/database';
import { Resolver } from 'interfaces/models/common';
import { BuildingId } from 'interfaces/models/game/building';
import { GameEventType } from 'interfaces/models/events/game-event';

const updateBuildingFieldLevel = (villages: Village[], villageId: Village['id'], buildingFieldId: BuildingField['id'], level: number): Village[] => {
  return villages.map((village) => {
    if (village.id === villageId) {
      return {
        ...village,
        buildingFields: village.buildingFields.map((buildingField) => {
          if (buildingField.id === buildingFieldId) {
            return {
              ...buildingField,
              level
            }
          }
          return buildingField;
        }),
      };
    }
    return village;
  });
};

const addBuildingField = (villages: Village[], villageId: Village['id'], buildingFieldId: BuildingField['id'], buildingId: BuildingId): Village[] => {
  return villages.map((village) => {
    if (village.id === villageId) {
      return {
        ...village,
        buildingFields: [...village.buildingFields, { id: buildingFieldId, buildingId, level: 1 }],
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
  const { serverId, villageId, buildingFieldId, level } = args;

  queryClient.setQueryData<Village[]>([villagesCacheKey, serverId], (prevData) => {
    return updateBuildingFieldLevel(prevData!, villageId, buildingFieldId, level);
  });

  database.villages.where({ serverId, id: villageId }).modify((value) => {
    value.buildingFields = value.buildingFields.map((buildingField) => {
      if (buildingField.id === buildingFieldId) {
        return {
          ...buildingField,
          level,
        }
      }
      return buildingField;
    });
  });
};

export const buildingConstructionResolver: Resolver<GameEventType.BUILDING_CONSTRUCTION> = async (args, queryClient) => {
  const { serverId, villageId, buildingFieldId, building } = args;
  const { id: buildingId } = building;

  queryClient.setQueryData<Village[]>([villagesCacheKey, serverId], (prevData) => {
    return addBuildingField(prevData!, villageId, buildingFieldId, buildingId);
  });

  database.villages.where({ serverId, id: villageId }).modify((value) => {
    value.buildingFields = [...value.buildingFields, { level: 0, id: buildingFieldId, buildingId }];
  });
};

export const buildingDestructionResolver: Resolver<GameEventType.BUILDING_DESTRUCTION> = async (args, queryClient) => {
  const { serverId, villageId, buildingFieldId } = args;

  // Some fields are special and cannot be destroyed, because they must exist on a specific field: all resource fields, rally point & wall.
  const specialFieldIds: BuildingField['id'][] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 39, 40];

  if(specialFieldIds.includes(buildingFieldId)) {
    buildingLevelChangeResolver({...args, level: 0}, queryClient);
    return;
  }

  queryClient.setQueryData<Village[]>([villagesCacheKey, serverId], (prevData) => {
    return removeBuildingField(prevData!, villageId, buildingFieldId);
  });

  database.villages.where({ serverId, id: villageId }).modify((value) => {
    value.buildingFields = value.buildingFields.filter(({ id }) => id !== buildingFieldId);
  });
};


