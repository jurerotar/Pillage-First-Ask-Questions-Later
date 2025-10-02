import type { Resource } from 'app/interfaces/models/game/resource';
import type {
  BuildingField,
  ResourceFieldComposition,
  VillageSize,
} from 'app/interfaces/models/game/village';
import type { Building } from 'app/interfaces/models/game/building';

type ResourceFieldLayout = Record<number, Resource>;

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
const staticResourcesLayout: Pick<
  ResourceFieldLayout,
  3 | 4 | 6 | 7 | 11 | 14 | 16 | 17 | 18
> = {
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
const resourceFieldsLayouts: Record<
  ResourceFieldComposition,
  ResourceFieldLayout
> = {
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

// TODO: Update these
const villageSizeToResourceFieldsLevelMap = new Map<
  VillageSize | 'player',
  number
>([
  ['player', 0],
  ['xxs', 3],
  ['xs', 3],
  ['sm', 5],
  ['md', 8],
  ['lg', 10],
  ['xl', 10],
  ['2xl', 10],
  ['3xl', 10],
  ['4xl', 10],
]);

const resourceTypeToResourceBuildingIdMap = new Map<Resource, Building['id']>([
  ['wood', 'WOODCUTTER'],
  ['clay', 'CLAY_PIT'],
  ['iron', 'IRON_MINE'],
  ['wheat', 'WHEAT_FIELD'],
]);

const convertResourceFieldLayoutToResourceField = (
  resourceFieldLayout: ResourceFieldLayout,
  level: number,
): BuildingField[] => {
  return Object.keys(resourceFieldLayout).map((fieldId) => {
    const buildingFieldId = Number(fieldId);
    const type = resourceFieldLayout[buildingFieldId];
    return {
      id: Number(buildingFieldId),
      level,
      buildingId: resourceTypeToResourceBuildingIdMap.get(type)!,
    };
  });
};

export const createVillageResourceFields = (
  resourceFieldComposition: ResourceFieldComposition,
  villageSize: VillageSize | 'player',
): BuildingField[] => {
  const resourceFieldsLayout = resourceFieldsLayouts[resourceFieldComposition];
  const resourceFieldsLevel =
    villageSizeToResourceFieldsLevelMap.get(villageSize)!;
  return convertResourceFieldLayoutToResourceField(
    resourceFieldsLayout,
    resourceFieldsLevel,
  );
};

export const xxsVillageResourceFieldsPreset = createVillageResourceFields(
  '4446',
  'xs',
);
export const xsVillageResourceFieldsPreset = createVillageResourceFields(
  '4446',
  'xs',
);
export const smVillageResourceFieldsPreset = createVillageResourceFields(
  '4446',
  'sm',
);
export const mdVillageResourceFieldsPreset = createVillageResourceFields(
  '4446',
  'md',
);
export const lgVillageResourceFieldsPreset = createVillageResourceFields(
  '4446',
  'lg',
);
export const xlVillageResourceFieldsPreset = createVillageResourceFields(
  '4446',
  'xl',
);
export const xxlVillageResourceFieldsPreset = createVillageResourceFields(
  '4446',
  '2xl',
);
export const xxxlVillageResourceFieldsPreset = createVillageResourceFields(
  '4446',
  '3xl',
);
export const xxxxlVillageResourceFieldsPreset = createVillageResourceFields(
  '4446',
  '4xl',
);
