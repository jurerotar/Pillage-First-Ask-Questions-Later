import { getBuildingData } from 'app/(game)/(village-slug)/utils/building';
import { merchants } from 'app/(game)/(village-slug)/assets/merchants';
import type { Building, BuildingEffect } from 'app/interfaces/models/game/building';
import type {
  Effect,
  GlobalEffect,
  HeroEffect,
  ServerEffect,
  TribalEffect,
  VillageBuildingEffect,
  VillageEffect,
} from 'app/interfaces/models/game/effect';
import type { Server } from 'app/interfaces/models/game/server';
import type { BuildingField, Village } from 'app/interfaces/models/game/village';

type NewBuildingEffectFactoryArgs = {
  villageId: Village['id'];
  id: Effect['id'];
  value: number;
  buildingFieldId: BuildingField['id'];
  buildingId: Building['id'];
};

export const newBuildingEffectFactory = (args: NewBuildingEffectFactoryArgs): VillageBuildingEffect => {
  return {
    ...args,
    scope: 'village',
    source: 'building',
  };
};

const newVillageBuildingFieldsEffectsFactory = (village: Village): VillageBuildingEffect[] => {
  return village.buildingFields.flatMap(({ buildingId, id, level }: BuildingField) => {
    const building = getBuildingData(buildingId);
    return building.effects.map(({ effectId, valuesPerLevel }: BuildingEffect) =>
      newBuildingEffectFactory({
        id: effectId,
        villageId: village.id,
        value: valuesPerLevel[level],
        buildingFieldId: id,
        buildingId,
      }),
    );
  });
};

export const newVillageEffectsFactory = (village: Village): VillageEffect[] => {
  const villageDefaultStorageEffectsIds: Effect['id'][] = ['warehouseCapacity', 'granaryCapacity'];
  return [
    ...newVillageBuildingFieldsEffectsFactory(village),
    ...villageDefaultStorageEffectsIds.map((effectId) => {
      return {
        id: effectId,
        scope: 'village',
        source: 'server',
        value: 800,
        villageId: village.id,
      } satisfies VillageEffect;
    }),
    {
      id: 'wheatProduction',
      scope: 'village',
      source: 'troops',
      value: 0,
      villageId: village.id,
    },
  ];
};

const globalEffectsFactory = (server: Server): GlobalEffect[] => {
  const { tribe } = server.playerConfiguration;

  const tribeMerchant = merchants.find(({ tribe: tribeToFind }) => tribeToFind === tribe)!;

  const merchantEffects: Omit<TribalEffect, 'scope'>[] = [
    {
      id: 'merchantCapacity',
      value: tribeMerchant.merchantCapacity,
      source: 'tribe',
    },
    {
      id: 'merchantSpeed',
      value: tribeMerchant.merchantSpeed,
      source: 'tribe',
    },
  ];

  const heroEffects: Omit<HeroEffect, 'scope'>[] = [
    {
      id: 'attack',
      value: 1.001,
      source: 'hero',
    },
    {
      id: 'infantryDefence',
      value: 1.001,
      source: 'hero',
    },
    {
      id: 'cavalryDefence',
      value: 1.001,
      source: 'hero',
    },
    {
      id: 'woodProduction',
      value: 1.001,
      source: 'hero',
    },
    {
      id: 'clayProduction',
      value: 1.001,
      source: 'hero',
    },
    {
      id: 'ironProduction',
      value: 1.001,
      source: 'hero',
    },
    {
      id: 'wheatProduction',
      value: 1.001,
      source: 'hero',
    },
  ];

  return [...merchantEffects, ...heroEffects].map((partialEffect) => ({
    ...partialEffect,
    scope: 'global',
  }));
};

const serverEffectsFactory = (server: Server): ServerEffect[] => {
  const {
    configuration: { speed },
  } = server;

  const increasedValueEffectIds: ServerEffect['id'][] = [
    'merchantCapacity',
    'merchantSpeed',
    'woodProduction',
    'clayProduction',
    'ironProduction',
    'wheatProduction',
    'unitSpeed',
  ];

  const decreasedValueEffectIds: ServerEffect['id'][] = [
    'barracksTrainingDuration',
    'greatBarracksTrainingDuration',
    'stableTrainingDuration',
    'greatStableTrainingDuration',
    'workshopTrainingDuration',
    'hospitalTrainingDuration',
    'buildingDuration',
  ];

  const serverEffectIds: ServerEffect['id'][] = [...increasedValueEffectIds, ...decreasedValueEffectIds];

  return serverEffectIds.map((effectId) => {
    const value = increasedValueEffectIds.includes(effectId) ? speed : 1 / speed;
    return {
      id: effectId,
      value,
      source: 'server',
      scope: 'server',
    };
  });
};

export const generateEffects = (server: Server, village: Village): Effect[] => {
  const serverEffects = serverEffectsFactory(server);
  const globalEffects = globalEffectsFactory(server);
  const villageEffects = newVillageEffectsFactory(village);

  return [...serverEffects, ...globalEffects, ...villageEffects];
};
