import { BuildingField, ResourceFieldComposition, ResourceFieldId, Village } from 'interfaces/models/game/village';
import { Server } from 'interfaces/models/game/server';
import { Resource } from 'interfaces/models/game/resource';
import { Player } from 'interfaces/models/game/player';
import { OccupiedOccupiableTile } from 'interfaces/models/game/tile';
import { Tribe } from 'interfaces/models/game/tribe';
import {
  egyptianNewVillageBuildingFieldsPreset,
  gaulNewVillageBuildingFieldsPreset,
  hunNewVillageBuildingFieldsPreset,
  romanNewVillageBuildingFieldsPreset,
  teutonNewVillageBuildingFieldsPreset,
} from 'assets/village-presets';
import { BuildingId } from 'interfaces/models/game/building';

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

const convertResourceFieldLayoutToResourceField = (resourceFieldLayout: ResourceFieldLayout): BuildingField[] => {
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
      level: 0,
      buildingId: resourceTypeToResourceBuildingIdMap.get(type)!,
    };
  });
};

const getVillageResourceFields = (resourceFieldComposition: ResourceFieldComposition): BuildingField[] => {
  const resourceFieldsLayout = resourceFieldsLayouts[resourceFieldComposition];
  return convertResourceFieldLayoutToResourceField(resourceFieldsLayout);
};

const getNewVillageBuildingFields = (tribe: Tribe): BuildingField[] => {
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

export const villageFactory = ({ server, tile, player, slug }: VillageFactoryProps): Village => {
  const { coordinates, resourceFieldComposition } = tile;

  const { id: playerId, name, tribe } = player;

  const buildingFields = [...getVillageResourceFields(resourceFieldComposition), ...getNewVillageBuildingFields(tribe)];

  return {
    serverId: server.id,
    id: tile.id,
    name: `${name}'s village`,
    slug,
    coordinates,
    buildingFields,
    playerId,
    isCapital: false,
    lastUpdatedAt: Date.now(),
    resources: {
      wood: 750,
      clay: 750,
      iron: 750,
      wheat: 750,
    },
  };
};
