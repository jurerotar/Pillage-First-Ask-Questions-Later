import { getBuildingData } from 'app/(game)/(village-slug)/utils/building';
import { merchants } from 'app/assets/merchants';
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
import type { Village } from 'app/interfaces/models/game/village';
import type { Hero } from 'app/interfaces/models/game/hero';
import type { OasisTile, Tile } from 'app/interfaces/models/game/tile';
import type { BuildingField } from 'app/interfaces/models/game/building-field';

const heroEffectsFactory = (
  server: Server,
  villageId: Village['id'],
  hero: Hero,
): HeroEffect[] => {
  const tribe = server.playerConfiguration.tribe;
  const { selectableAttributes, resourceToProduce } = hero;

  const baseResourceProduction = resourceToProduce === 'shared' ? 9 : 10;
  const tribalModifier = tribe === 'egyptians' ? 2 : 1;

  const heroEffects: Pick<HeroEffect, 'id' | 'value' | 'type'>[] = [
    {
      id: 'attack',
      value: selectableAttributes.attackBonus * 0.2,
      type: 'bonus',
    },
    {
      id: 'infantryDefence',
      value: selectableAttributes.defenceBonus * 0.2,
      type: 'bonus',
    },
    {
      id: 'cavalryDefence',
      value: selectableAttributes.defenceBonus * 0.2,
      type: 'bonus',
    },
    ...((resourceToProduce === 'shared' || resourceToProduce === 'wood'
      ? [
          {
            id: 'woodProduction',
            value:
              baseResourceProduction *
              tribalModifier *
              selectableAttributes.resourceProduction,
            type: 'base',
          },
        ]
      : []) satisfies Pick<HeroEffect, 'id' | 'value' | 'type'>[]),
    ...((resourceToProduce === 'shared' || resourceToProduce === 'wood'
      ? [
          {
            id: 'clayProduction',
            value:
              baseResourceProduction *
              tribalModifier *
              selectableAttributes.resourceProduction,
            type: 'base',
          },
        ]
      : []) satisfies Pick<HeroEffect, 'id' | 'value' | 'type'>[]),
    ...((resourceToProduce === 'shared' || resourceToProduce === 'wood'
      ? [
          {
            id: 'ironProduction',
            value:
              baseResourceProduction *
              tribalModifier *
              selectableAttributes.resourceProduction,
            type: 'base',
          },
        ]
      : []) satisfies Pick<HeroEffect, 'id' | 'value' | 'type'>[]),
    ...((resourceToProduce === 'shared' || resourceToProduce === 'wood'
      ? [
          {
            id: 'wheatProduction',
            value:
              baseResourceProduction *
              tribalModifier *
              selectableAttributes.resourceProduction,
            type: 'base',
          },
        ]
      : []) satisfies Pick<HeroEffect, 'id' | 'value' | 'type'>[]),
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
      type: 'bonus',
    } satisfies OasisEffect;
  });
};

type NewBuildingEffectFactoryArgs = {
  villageId: Village['id'];
  id: Effect['id'];
  value: number;
  buildingFieldId: BuildingField['id'];
  buildingId: Building['id'];
  type: Effect['type'];
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
        ({ effectId, valuesPerLevel, type }: BuildingEffect) =>
          newBuildingEffectFactory({
            id: effectId,
            villageId: village.id,
            value: valuesPerLevel[level],
            buildingFieldId: id,
            buildingId,
            type,
          }),
      );
    },
  );
};

export const newVillageEffectsFactory = (
  village: Village,
  isFirstVillage = false,
): VillageEffect[] => {
  return [
    ...newVillageBuildingFieldsEffectsFactory(village),
    {
      id: 'warehouseCapacity',
      scope: 'village',
      source: 'building',
      value: 800,
      villageId: village.id,
      buildingId: 'WAREHOUSE',
      buildingFieldId: 0,
      type: 'base',
    } satisfies VillageBuildingEffect,
    {
      id: 'granaryCapacity',
      scope: 'village',
      source: 'building',
      value: 800,
      villageId: village.id,
      buildingId: 'GRANARY',
      buildingFieldId: 0,
      type: 'base',
    } satisfies VillageBuildingEffect,
    {
      id: 'wheatProduction',
      scope: 'village',
      source: 'troops',
      value: isFirstVillage ? 3 : 0,
      villageId: village.id,
      type: 'base',
    },
    {
      id: 'wheatProduction',
      scope: 'village',
      source: 'building',
      value: 3,
      villageId: village.id,
      type: 'base',
      buildingFieldId: 0,
      buildingId: 'MAIN_BUILDING',
    } satisfies VillageBuildingEffect,
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
      type: 'base',
    },
    {
      id: 'merchantSpeed',
      value: tribeMerchant.merchantSpeed,
      source: 'tribe',
      type: 'base',
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
    'unitResearchDuration',
    'unitImprovementDuration',
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
      type: 'bonus',
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
  const villageEffects = newVillageEffectsFactory(village, true);
  const heroEffects = heroEffectsFactory(server, village.id, hero);

  return [
    ...serverEffects,
    ...globalEffects,
    ...villageEffects,
    ...heroEffects,
  ];
};
