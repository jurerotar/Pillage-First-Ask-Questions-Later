import { getBuildingData } from 'app/(game)/(village-slug)/utils/building';
import { merchants } from 'app/(game)/(village-slug)/assets/merchants';
import type {
  Building,
  BuildingEffect,
} from 'app/interfaces/models/game/building';
import type {
  Effect,
  GlobalEffect,
  HeroEffect,
  OasisEffect,
  ServerEffect,
  TribalEffect,
  VillageBuildingEffect,
  VillageEffect,
} from 'app/interfaces/models/game/effect';
import type { Server } from 'app/interfaces/models/game/server';
import type {
  BuildingField,
  Village,
} from 'app/interfaces/models/game/village';
import type { Hero } from 'app/interfaces/models/game/hero';
import type { OasisTile, Tile } from 'app/interfaces/models/game/tile';

const heroEffectsFactory = (villageId: Village['id'], hero: Hero): Effect[] => {
  const { selectableAttributes, tribe } = hero;

  const baseResourceProduction = 9;
  const baseHeroProduction =
    tribe === 'egyptians' ? baseResourceProduction * 2 : baseResourceProduction;

  const heroEffects: Pick<HeroEffect, 'id' | 'value'>[] = [
    {
      id: 'attack',
      value: 1.001 * selectableAttributes.attackBonus * 0.2,
    },
    {
      id: 'infantryDefence',
      value: 1.001 * selectableAttributes.defenceBonus * 0.2,
    },
    {
      id: 'cavalryDefence',
      value: 1.001 * selectableAttributes.defenceBonus * 0.2,
    },
    {
      id: 'woodProduction',
      value: baseHeroProduction * selectableAttributes.resourceProduction,
    },
    {
      id: 'clayProduction',
      value: baseHeroProduction * selectableAttributes.resourceProduction,
    },
    {
      id: 'ironProduction',
      value: baseHeroProduction * selectableAttributes.resourceProduction,
    },
    {
      id: 'wheatProduction',
      value: baseHeroProduction * selectableAttributes.resourceProduction,
    },
  ];

  return heroEffects.map((effect) => ({
    ...effect,
    scope: 'village',
    source: 'hero',
    villageId,
  }));
};

export const oasisEffectsFactory = (
  villageId: Village['id'],
  oasisId: Tile['id'],
  oasisResourceBonus: OasisTile['ORB'],
): Effect[] => {
  return oasisResourceBonus.map(({ resource, bonus }) => {
    return {
      id: `${resource}Production`,
      scope: 'village',
      source: 'oasis',
      value: bonus === '25%' ? 1.25 : 1.5,
      villageId,
      oasisId,
    } satisfies OasisEffect;
  });
};

type NewBuildingEffectFactoryArgs = {
  villageId: Village['id'];
  id: Effect['id'];
  value: number;
  buildingFieldId: BuildingField['id'];
  buildingId: Building['id'];
};

export const newBuildingEffectFactory = (
  args: NewBuildingEffectFactoryArgs,
): VillageBuildingEffect => {
  return {
    ...args,
    scope: 'village',
    source: 'building',
  };
};

const newVillageBuildingFieldsEffectsFactory = (
  village: Village,
): VillageBuildingEffect[] => {
  return village.buildingFields.flatMap(
    ({ buildingId, id, level }: BuildingField) => {
      const building = getBuildingData(buildingId);
      return building.effects.map(
        ({ effectId, valuesPerLevel }: BuildingEffect) =>
          newBuildingEffectFactory({
            id: effectId,
            villageId: village.id,
            value: valuesPerLevel[level],
            buildingFieldId: id,
            buildingId,
          }),
      );
    },
  );
};

export const newVillageEffectsFactory = (village: Village): VillageEffect[] => {
  return [
    ...newVillageBuildingFieldsEffectsFactory(village),
    {
      id: 'warehouseCapacity',
      scope: 'village',
      source: 'building',
      value: 800,
      villageId: village.id,
      buildingId: 'WAREHOUSE',
      buildingFieldId: 'hidden',
    } satisfies VillageBuildingEffect,
    {
      id: 'granaryCapacity',
      scope: 'village',
      source: 'building',
      value: 800,
      villageId: village.id,
      buildingId: 'GRANARY',
      buildingFieldId: 'hidden',
    } satisfies VillageBuildingEffect,
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

  const tribeMerchant = merchants.find(
    ({ tribe: tribeToFind }) => tribeToFind === tribe,
  )!;

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

  return [...merchantEffects].map((partialEffect) => ({
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

  const serverEffectIds: ServerEffect['id'][] = [
    ...increasedValueEffectIds,
    ...decreasedValueEffectIds,
  ];

  return serverEffectIds.map((effectId) => {
    const value = increasedValueEffectIds.includes(effectId)
      ? speed
      : 1 / speed;
    return {
      id: effectId,
      value,
      source: 'server',
      scope: 'server',
    };
  });
};

export const generateEffects = (
  server: Server,
  village: Village,
  hero: Hero,
): Effect[] => {
  const serverEffects = serverEffectsFactory(server);
  const globalEffects = globalEffectsFactory(server);
  const villageEffects = newVillageEffectsFactory(village);
  const heroEffects = heroEffectsFactory(village.id, hero);

  return [
    ...serverEffects,
    ...globalEffects,
    ...villageEffects,
    ...heroEffects,
  ];
};
