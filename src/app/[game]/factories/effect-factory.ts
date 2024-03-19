import { Server } from 'interfaces/models/game/server';
import { Effect, EffectType } from 'interfaces/models/game/effect';
import { BuildingField, Village } from 'interfaces/models/game/village';
import { getBuildingData } from 'app/[game]/utils/common';
import { BuildingEffect } from 'interfaces/models/game/building';


type NewVillageEffectFactoryProps = {
  server: Server;
  village: Village;
};

const newVillageBuildingFieldsEffectsFactory = (
  { village, server }: NewVillageEffectFactoryProps
): Effect<EffectType.VILLAGE_BUILDING>[] => {
  return village.buildingFields.flatMap(({ buildingId, id, level }: BuildingField) => {
    const building = getBuildingData(buildingId);
    return building.effects.map(({ effectId, valuesPerLevel }: BuildingEffect) => ({
      scope: 'village',
      villageId: village.id,
      serverId: server.id,
      id: effectId,
      value: valuesPerLevel[level],
      buildingFieldId: id,
    }) satisfies Effect<EffectType.VILLAGE_BUILDING>);
  });
};

const newVillageOasisExpansionSlotEffectsFactory = (
  { village, server }: NewVillageEffectFactoryProps
): Effect<EffectType.VILLAGE_OASIS>[] => {
  return [1, 2, 3].map((oasisExpansionSlotId) => ({
    scope: 'village',
    id: 'oasisExpansionSlot',
    villageId: village.id,
    serverId: server.id,
    tileId: null,
    oasisExpansionSlotId,
    wheat: 1,
    wood: 1,
    clay: 1,
    iron: 1,
  }));
};

export const newVillageEffectsFactory = (
  { server, village }: NewVillageEffectFactoryProps
): (Effect<EffectType.VILLAGE_OASIS> | Effect<EffectType.VILLAGE_BUILDING>)[] => {
  return [
    ...newVillageOasisExpansionSlotEffectsFactory({ server, village }),
    ...newVillageBuildingFieldsEffectsFactory({ server, village }),
  ];
};

type GlobalEffectFactoryProps = {
  server: Server;
};

export const globalEffectsFactory = ({ server }: GlobalEffectFactoryProps) => {
  return [
    {
      id: '',
      value: 1,
    },
  ].map((partialEffect) => ({
    ...partialEffect,
    serverId: server.id,
    scope: 'global',
  }));
};
