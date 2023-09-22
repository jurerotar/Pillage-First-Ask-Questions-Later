import { BuildingFields, ResourceFieldLayout, ResourceFieldLayoutByFieldType, Village } from 'interfaces/models/game/village';
import { v4 as uuidv4 } from 'uuid';
import { effects } from 'constants/effects';
import {
  createResourceFieldsFromResourceLayout
} from 'utils/game/create-resource-fields-from-resource-layout';

const newVillageBuildingFields: BuildingFields = {
  1: {
    buildingId: 'MAIN_BUILDING',
    level: 1
  },
  2: {
    buildingId: 'RALLY_POINT',
    level: 1
  },
  3: null,
  4: null,
  5: null,
  6: null,
  7: null,
  8: null,
  9: null,
  10: null,
  11: null,
  12: null,
  13: null,
  14: null,
  15: null,
  16: null,
  17: null,
  18: null,
  19: null,
  20: null
};

const fullWheatLayout: ResourceFieldLayout = {
  1: 'wheat',
  2: 'wheat',
  3: 'wheat',
  4: 'wheat',
  5: 'wheat',
  6: 'wheat',
  7: 'wheat',
  8: 'wheat',
  9: 'wheat',
  10: 'wheat',
  11: 'wheat',
  12: 'wheat',
  13: 'wheat',
  14: 'wheat',
  15: 'wheat',
  16: 'wheat',
  17: 'wheat',
  18: 'wheat'
};

// We set only non-wheat fields, since wheat field is the most common type
const resourceFields: ResourceFieldLayoutByFieldType = {
  '00018': fullWheatLayout,
  3339: {
    ...fullWheatLayout
    // 1: '',
    // 1: '',
    // 1: '',
    // 1: '',
    // 1: '',
    // 1: '',
    // 1: '',
    // 1: '',
    // 1: ''
  },
  3447: {
    ...fullWheatLayout
    // 1: '',
    // 4: '',
    // 5: '',
    // 6: '',
    // 7: '',
    // 10: '',
    // 11: '',
    // 14: '',
    // 16: '',
    // 17: '',
    // 18: ''
  },
  3456: {
    ...fullWheatLayout
    // 1: '',
    // 3: '',
    // 4: '',
    // 5: '',
    // 6: '',
    // 7: '',
    // 10: '',
    // 11: '',
    // 14: '',
    // 16: '',
    // 17: '',
    // 18: ''
  },
  3546: {
    ...fullWheatLayout
    // 1: '',
    // 3: '',
    // 4: '',
    // 5: '',
    // 6: '',
    // 7: '',
    // 10: '',
    // 11: '',
    // 14: '',
    // 16: '',
    // 17: '',
    // 18: ''
  },
  4347: {
    ...fullWheatLayout
    // 1: '',
    // 4: '',
    // 5: '',
    // 6: '',
    // 7: '',
    // 10: '',
    // 11: '',
    // 14: '',
    // 16: '',
    // 17: '',
    // 18: ''
  },
  4356: {
    ...fullWheatLayout
    // 1: '',
    // 3: '',
    // 4: '',
    // 5: '',
    // 6: '',
    // 7: '',
    // 10: '',
    // 11: '',
    // 14: '',
    // 16: '',
    // 17: '',
    // 18: ''
  },
  4437: {
    ...fullWheatLayout
    // 1: '',
    // 4: '',
    // 5: '',
    // 6: '',
    // 7: '',
    // 10: '',
    // 11: '',
    // 14: '',
    // 16: '',
    // 17: '',
    // 18: ''
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
    ...fullWheatLayout
    // 1: '',
    // 3: '',
    // 4: '',
    // 5: '',
    // 6: '',
    // 7: '',
    // 10: '',
    // 11: '',
    // 14: '',
    // 16: '',
    // 17: '',
    // 18: ''
  },
  5346: {
    ...fullWheatLayout
    // 1: '',
    // 3: '',
    // 4: '',
    // 5: '',
    // 6: '',
    // 7: '',
    // 10: '',
    // 11: '',
    // 14: '',
    // 16: '',
    // 17: '',
    // 18: ''
  },
  5436: {
    ...fullWheatLayout
    // 1: '',
    // 3: '',
    // 4: '',
    // 5: '',
    // 6: '',
    // 7: '',
    // 10: '',
    // 11: '',
    // 14: '',
    // 16: '',
    // 17: '',
    // 18: ''
  },
  11115: {
    ...fullWheatLayout,
    3: 'wood',
    4: 'iron',
    16: 'clay'
  }
};

// This is default new (4-4-4-6) village. Some properties need to be changed on creation based on the type of village
export const newVillage: Village = {
  id: uuidv4(),
  name: 'New village',
  lastUpdatedAt: Date.now(),
  position: {
    x: 0,
    y: 0
  },
  resources: {
    wood: 750,
    clay: 750,
    iron: 750,
    wheat: 750
  },
  storageCapacity: {
    wood: 800,
    clay: 800,
    iron: 800,
    wheat: 800
  },
  hourlyProduction: {
    wood: 16,
    clay: 16,
    iron: 16,
    wheat: 24
  },
  effects,
  resourceFields: createResourceFieldsFromResourceLayout(resourceFields['4446']),
  buildingFields: newVillageBuildingFields,
  isCapital: true,
  quests: []
};
