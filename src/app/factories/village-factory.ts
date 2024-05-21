import {
  egyptianNewVillageBuildingFieldsPreset,
  gaulNewVillageBuildingFieldsPreset,
  hunNewVillageBuildingFieldsPreset,
  romanNewVillageBuildingFieldsPreset,
  teutonNewVillageBuildingFieldsPreset,
} from 'assets/village-presets';
import type { BuildingId } from 'interfaces/models/game/building';
import type { Player } from 'interfaces/models/game/player';
import type { Resource, Resources } from 'interfaces/models/game/resource';
import type { Server } from 'interfaces/models/game/server';
import type { OccupiedOccupiableTile } from 'interfaces/models/game/tile';
import type { Tribe } from 'interfaces/models/game/tribe';
import type { BuildingField, ResourceFieldComposition, ResourceFieldId, Village } from 'interfaces/models/game/village';

export type ResourceFieldLayout = Record<ResourceFieldId, Resource>;

const fullWheatLayout: ResourceFieldLayout = Object.fromEntries([...new Array(18)].map((_, i) => [[i + 1], 'wheat']));

// We set only non-wheat fields, since wheat field is the most common type
const resourceFieldsLayouts: Record<ResourceFieldComposition, ResourceFieldLayout> = {
  '00018': fullWheatLayout,
  3339: {
    ...fullWheatLayout,
    1: 'wheat',
    4: 'wheat',
    5: 'wheat',
    3: 'wood',
    6: 'clay',
    7: 'iron',
    10: 'iron',
    11: 'iron',
    14: 'wood',
    16: 'clay',
    17: 'wood',
    18: 'clay',
  },
  3447: {
    ...fullWheatLayout,
    1: 'iron',
    3: 'wheat',
    4: 'iron',
    5: 'clay',
    6: 'clay',
    7: 'iron',
    10: 'iron',
    11: 'iron',
    14: 'wood',
    16: 'clay',
    17: 'wood',
    18: 'clay',
  },
  3456: {
    ...fullWheatLayout,
    1: 'iron',
    3: 'wood',
    4: 'iron',
    5: 'clay',
    6: 'clay',
    7: 'iron',
    10: 'iron',
    11: 'iron',
    14: 'wood',
    16: 'clay',
    17: 'wood',
    18: 'clay',
  },
  3546: {
    ...fullWheatLayout,
    1: 'iron',
    3: 'wood',
    4: 'clay',
    5: 'clay',
    6: 'clay',
    7: 'iron',
    10: 'iron',
    11: 'iron',
    14: 'wood',
    16: 'clay',
    17: 'wood',
    18: 'clay',
  },
  4347: {
    ...fullWheatLayout,
    1: 'wood',
    3: 'wheat',
    4: 'iron',
    5: 'wood',
    6: 'clay',
    7: 'iron',
    10: 'iron',
    11: 'iron',
    14: 'wood',
    16: 'clay',
    17: 'wood',
    18: 'clay',
  },
  4356: {
    ...fullWheatLayout,
    1: 'iron',
    2: 'wood',
    3: 'wood',
    4: 'iron',
    5: 'wood',
    6: 'wheat',
    7: 'wheat',
    8: 'iron',
    9: 'iron',
    10: 'clay',
    11: 'clay',
    12: 'iron',
    13: 'wood',
    16: 'clay',
  },
  4437: {
    ...fullWheatLayout,
    1: 'wood',
    3: 'wheat',
    4: 'iron',
    5: 'clay',
    6: 'clay',
    7: 'iron',
    10: 'iron',
    11: 'iron',
    14: 'wood',
    16: 'clay',
    17: 'wood',
    18: 'clay',
  },
  4446: {
    ...fullWheatLayout,
    1: 'wood',
    3: 'wood',
    4: 'iron',
    5: 'clay',
    6: 'clay',
    7: 'iron',
    10: 'iron',
    11: 'iron',
    14: 'wood',
    16: 'clay',
    17: 'wood',
    18: 'clay',
  },
  4536: {
    ...fullWheatLayout,
    1: 'wood',
    3: 'wood',
    4: 'clay',
    5: 'clay',
    6: 'clay',
    7: 'iron',
    10: 'iron',
    11: 'iron',
    14: 'wood',
    16: 'clay',
    17: 'wood',
    18: 'clay',
  },
  5346: {
    ...fullWheatLayout,
    1: 'wood',
    3: 'wood',
    4: 'iron',
    5: 'wood',
    6: 'clay',
    7: 'iron',
    10: 'iron',
    11: 'iron',
    14: 'wood',
    16: 'clay',
    17: 'wood',
    18: 'clay',
  },
  5436: {
    ...fullWheatLayout,
    1: 'wood',
    3: 'wood',
    4: 'wood',
    5: 'clay',
    6: 'clay',
    7: 'iron',
    10: 'iron',
    11: 'iron',
    14: 'wood',
    16: 'clay',
    17: 'wood',
    18: 'clay',
  },
  11115: {
    ...fullWheatLayout,
    3: 'wood',
    4: 'iron',
    16: 'clay',
  },
};

const villageSizeToResourceFieldsLevel = new Map<OccupiedOccupiableTile['villageSize'] | 'player', number>([
  ['player', 0],
  ['xs', 3],
  ['sm', 5],
  ['md', 8],
  ['lg', 10],
]);

const convertResourceFieldLayoutToResourceField = (resourceFieldLayout: ResourceFieldLayout, level: number): BuildingField[] => {
  const resourceTypeToResourceBuildingIdMap = new Map<Resource, BuildingId>([
    ['wood', 'WOODCUTTER'],
    ['clay', 'CLAY_PIT'],
    ['iron', 'IRON_MINE'],
    ['wheat', 'CROPLAND'],
  ]);

  return Object.keys(resourceFieldLayout).map((fieldId) => {
    const buildingFieldId = Number(fieldId) as ResourceFieldId;
    const type = resourceFieldLayout[buildingFieldId];
    return {
      id: Number(buildingFieldId) as ResourceFieldId,
      level,
      buildingId: resourceTypeToResourceBuildingIdMap.get(type)!,
    };
  });
};

const getVillageResourceFields = (
  resourceFieldComposition: ResourceFieldComposition,
  villageSize: OccupiedOccupiableTile['villageSize'] | 'player'
): BuildingField[] => {
  const resourceFieldsLayout = resourceFieldsLayouts[resourceFieldComposition];
  const resourceFieldsLevel = villageSizeToResourceFieldsLevel.get(villageSize)!;
  return convertResourceFieldLayoutToResourceField(resourceFieldsLayout, resourceFieldsLevel);
};

// TODO: Resources should be affected by village size as well
const getVillageResources = (villageSize: OccupiedOccupiableTile['villageSize'] | 'player'): Resources => {
  if (villageSize === 'player') {
    return {
      wood: 750,
      clay: 750,
      iron: 750,
      wheat: 750,
    };
  }
  return {
    wood: 750,
    clay: 750,
    iron: 750,
    wheat: 750,
  };
};

// TODO: NPC villages must also have different level buildings created
const getNewVillageBuildingFields = (tribe: Tribe, _villageSize: OccupiedOccupiableTile['villageSize'] | 'player'): BuildingField[] => {
  const tribeToNewVillageBuildingFieldsMap = new Map<Tribe, BuildingField[]>([
    ['romans', romanNewVillageBuildingFieldsPreset],
    ['gauls', gaulNewVillageBuildingFieldsPreset],
    ['teutons', teutonNewVillageBuildingFieldsPreset],
    ['huns', hunNewVillageBuildingFieldsPreset],
    ['egyptians', egyptianNewVillageBuildingFieldsPreset],
  ]);

  return tribeToNewVillageBuildingFieldsMap.get(tribe)!;
};

type VillageFactoryProps = {
  server: Server;
  tile: OccupiedOccupiableTile;
  player: Player;
  slug: Village['slug'];
};

export const userVillageFactory = ({ server, tile, player, slug }: VillageFactoryProps): Village => {
  const { coordinates, resourceFieldComposition } = tile;

  const { id: playerId, name, tribe } = player;

  const buildingFields = [...getVillageResourceFields(resourceFieldComposition, 'player'), ...getNewVillageBuildingFields(tribe, 'player')];

  return {
    serverId: server.id,
    id: tile.id,
    name: `${name}'s village`,
    slug,
    coordinates,
    buildingFields,
    playerId,
    isCapital: true,
    lastUpdatedAt: Date.now(),
    resources: {
      wood: 750,
      clay: 750,
      iron: 750,
      wheat: 750,
    },
  };
};

type NpcVillageFactoryProps = Omit<VillageFactoryProps, 'slug'>;

export const npcVillageFactory = ({ server, tile, player }: NpcVillageFactoryProps): Village => {
  const { coordinates, resourceFieldComposition, villageSize } = tile;

  const { id: playerId, name, tribe } = player;

  const buildingFields = [
    ...getVillageResourceFields(resourceFieldComposition, villageSize),
    ...getNewVillageBuildingFields(tribe, villageSize),
  ];

  return {
    serverId: server.id,
    id: tile.id,
    name: `${name}'s village`,
    slug: null,
    coordinates,
    buildingFields,
    playerId,
    isCapital: false,
    lastUpdatedAt: Date.now(),
    resources: getVillageResources(villageSize),
  };
};
