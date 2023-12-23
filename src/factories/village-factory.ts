import {
  BuildingField,
  ResourceField,
  ResourceFieldComposition,
  ResourceFieldId,
  Village,
  VillageBuildingFieldsPresetName
} from 'interfaces/models/game/village';
import { Server } from 'interfaces/models/game/server';
import { villagePresets } from 'assets/village-presets';
import { Resource } from 'interfaces/models/game/resource';
import { Player } from 'interfaces/models/game/player';
import { OccupiedOccupiableTile } from 'interfaces/models/game/tile';

export type ResourceFieldLayout = Record<ResourceFieldId, Resource>;

const fullWheatLayout: ResourceFieldLayout = Object.fromEntries([...(new Array(18))].map((_, i) => [[i + 1], 'wheat']));

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
    18: 'clay'
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
    18: 'clay'
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
    18: 'clay'
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
    18: 'clay'
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
    18: 'clay'
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
    16: 'clay'
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
    18: 'clay'
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
    18: 'clay'
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
    18: 'clay'
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
    18: 'clay'
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
    18: 'clay'
  },
  11115: {
    ...fullWheatLayout,
    3: 'wood',
    4: 'iron',
    16: 'clay'
  }
};

const convertResourceFieldLayoutToResourceField = (resourceFieldLayout: ResourceFieldLayout): ResourceField[] => {
  return (Object.keys(resourceFieldLayout) as ResourceFieldId[]).map((resourceFieldId: ResourceFieldId) => {
    const type = resourceFieldLayout[resourceFieldId];
    return {
      resourceFieldId,
      type,
      level: 0
    };
  });
};

const getVillageResourceFields = (resourceFieldComposition: ResourceFieldComposition): ResourceField[] => {
  const resourceFieldsLayout = resourceFieldsLayouts[resourceFieldComposition];
  return convertResourceFieldLayoutToResourceField(resourceFieldsLayout);
};

const getVillageBuildingFields = (presetName: VillageBuildingFieldsPresetName): BuildingField[] => {
  return villagePresets.find(({ preset }) => preset === presetName)!.buildingFields;
};

type VillageFactoryProps = {
  server: Server;
  tile: OccupiedOccupiableTile;
  players: Player[];
  slug: Village['slug'];
};

export const villageFactory = ({
  server,
  tile,
  players,
  slug
}: VillageFactoryProps): Village => {
  const {
    coordinates,
    resourceFieldComposition
  } = tile;
  const {
    id: playerId,
    faction
  } = players.find((player) => player.id === tile.ownedBy)!;

  const resourceFields = getVillageResourceFields(resourceFieldComposition);
  const buildingFields = getVillageBuildingFields('new-village');

  return {
    serverId: server.id,
    id: crypto.randomUUID(),
    name: `${faction}-${tile.tileId}`,
    slug,
    coordinates,
    resourceFields,
    buildingFields,
    playerId,
    isCapital: false,
    lastUpdatedAt: Date.now(),
    resources: {
      wood: 750,
      clay: 750,
      iron: 750,
      wheat: 750
    }
  };
};
