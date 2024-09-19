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
import type { OccupiedOccupiableTile } from 'interfaces/models/game/tile';
import type { Tribe } from 'interfaces/models/game/tribe';
import type { BuildingField, ResourceFieldComposition, ResourceFieldId, Village } from 'interfaces/models/game/village';

type ResourceFieldLayout = Record<ResourceFieldId, Resource>;

// There's a couple of resource fields that never change, namely: 2, 8, 9, 12, 13, 15
// These resources are the same on every map
const staticWheatFields: Pick<ResourceFieldLayout, 2 | 8 | 9 | 12 | 13 | 15> = {
  2: 'wheat',
  8: 'wheat',
  9: 'wheat',
  12: 'wheat',
  13: 'wheat',
  15: 'wheat',
};

// These resources are on the same position on every layout, expect 00018
const staticResourcesLayout: Pick<ResourceFieldLayout, 3 | 4 | 6 | 7 | 11 | 14 | 16 | 17 | 18> = {
  3: 'wood',
  4: 'iron',
  6: 'clay',
  7: 'iron',
  11: 'iron',
  14: 'wood',
  16: 'clay',
  17: 'wood',
  18: 'clay',
};

// We set only non-wheat fields, since wheat field is the most common type
const resourceFieldsLayouts: Record<ResourceFieldComposition, ResourceFieldLayout> = {
  3456: {
    ...staticWheatFields,
    ...staticResourcesLayout,
    1: 'iron',
    5: 'clay',
    10: 'iron',
  },
  3546: {
    ...staticWheatFields,
    ...staticResourcesLayout,
    1: 'clay',
    5: 'clay',
    10: 'iron',
  },

  4356: {
    ...staticWheatFields,
    ...staticResourcesLayout,
    1: 'wood',
    5: 'iron',
    10: 'iron',
  },
  4536: {
    ...staticWheatFields,
    ...staticResourcesLayout,
    1: 'wood',
    5: 'clay',
    10: 'clay',
  },
  5346: {
    ...staticWheatFields,
    ...staticResourcesLayout,
    1: 'wood',
    5: 'wood',
    10: 'iron',
  },
  5436: {
    ...staticWheatFields,
    ...staticResourcesLayout,
    1: 'wood',
    5: 'clay',
    10: 'wood',
  },
  4446: {
    ...staticWheatFields,
    ...staticResourcesLayout,
    1: 'wood',
    5: 'clay',
    10: 'iron',
  },
  4437: {
    ...staticWheatFields,
    ...staticResourcesLayout,
    1: 'wood',
    5: 'clay',
    10: 'wheat',
  },
  4347: {
    ...staticWheatFields,
    ...staticResourcesLayout,
    1: 'wood',
    5: 'wheat',
    10: 'iron',
  },
  3447: {
    ...staticWheatFields,
    ...staticResourcesLayout,
    1: 'wheat',
    5: 'clay',
    10: 'iron',
  },
  3339: {
    ...staticWheatFields,
    ...staticResourcesLayout,
    1: 'wheat',
    5: 'wheat',
    10: 'wheat',
  },
  11115: {
    ...staticWheatFields,
    1: 'wheat',
    3: 'wood',
    4: 'iron',
    5: 'wheat',
    6: 'wheat',
    7: 'wheat',
    10: 'wheat',
    11: 'wheat',
    14: 'wheat',
    16: 'clay',
    17: 'wheat',
    18: 'wheat',
  },
  '00018': {
    ...staticWheatFields,
    1: 'wheat',
    3: 'wheat',
    4: 'wheat',
    5: 'wheat',
    6: 'wheat',
    7: 'wheat',
    10: 'wheat',
    11: 'wheat',
    14: 'wheat',
    16: 'wheat',
    17: 'wheat',
    18: 'wheat',
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
  villageSize: OccupiedOccupiableTile['villageSize'] | 'player',
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
  tile: OccupiedOccupiableTile;
  player: Player;
  slug: Village['slug'];
};

export const userVillageFactory = ({ tile, player, slug }: VillageFactoryProps): Village => {
  const { coordinates, resourceFieldComposition } = tile;

  const { id: playerId, name, tribe } = player;

  const buildingFields = [...getVillageResourceFields(resourceFieldComposition, 'player'), ...getNewVillageBuildingFields(tribe, 'player')];

  return {
    id: tile.id,
    name: `${name}'s village`,
    slug,
    coordinates,
    buildingFields,
    playerId,
    isCapital: true,
    lastUpdatedAt: Date.now(),
    resourceFieldComposition,
    resources: {
      wood: 750,
      clay: 750,
      iron: 750,
      wheat: 750,
    },
  };
};

type NpcVillageFactoryProps = Omit<VillageFactoryProps, 'slug'>;

const npcVillageFactory = ({ tile, player }: NpcVillageFactoryProps): Village => {
  const { coordinates, resourceFieldComposition, villageSize } = tile;

  const { id: playerId, name, tribe } = player;

  const buildingFields = [
    ...getVillageResourceFields(resourceFieldComposition, villageSize),
    ...getNewVillageBuildingFields(tribe, villageSize),
  ];

  return {
    id: tile.id,
    name: `${name}'s village`,
    slug: null,
    coordinates,
    buildingFields,
    playerId,
    isCapital: false,
    lastUpdatedAt: Date.now(),
    resources: getVillageResources(villageSize),
    resourceFieldComposition,
  };
};

type GenerateVillagesArgs = {
  occupiedOccupiableTiles: OccupiedOccupiableTile[];
  players: Player[];
};

export const generateVillages = ({ occupiedOccupiableTiles, players }: GenerateVillagesArgs) => {
  const userPlayer = players.find(({ faction }) => faction === 'player')!;
  const playerStartingTile = occupiedOccupiableTiles.find(({ coordinates: { x, y } }) => x === 0 && y === 0)!;
  const playerStartingVillage = userVillageFactory({ player: userPlayer, tile: playerStartingTile, slug: 'v-1' });

  const npcOccupiedTiles = occupiedOccupiableTiles.filter(({ ownedBy }) => ownedBy !== 'player');

  const villages: Village[] = npcOccupiedTiles.map((tile) => {
    const player = players.find(({ id }) => tile.ownedBy === id)!;
    return npcVillageFactory({ player, tile });
  });

  return [playerStartingVillage, ...villages];
};
