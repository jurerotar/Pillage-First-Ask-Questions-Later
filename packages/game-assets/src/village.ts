import type { Building } from '@pillage-first/types/models/building';
import type { ResourceFieldComposition } from '@pillage-first/types/models/resource-field-composition';
import type { Tribe } from '@pillage-first/types/models/tribe';
import type { VillageSize } from '@pillage-first/types/models/village';

export const npcVillageNameAdjectives: string[] = [
  'Sleepy',
  'Chonky',
  'Moist',
  'Sneaky',
  'Cursed',
  'Crusty',
  'Wiggly',
  'Spicy',
  'Zesty',
  'Grumpy',
  'Donut',
  'Floppy',
  'Tofu',
  'Boopy',
  'Snaccy',
  'Cheesy',
  'Feral',
  'Overcooked',
  'Funky',
  'Battle',
  'Unicorn',
  'NomNom',
  'Snoring',
  'Whiffled',
  'Goopy',
  'Thirsty',
  'Rumbly',
  'Twinkling',
  'Mossy',
  'Sizzling',
  'Greasy',
  'Plump',
  'Bashful',
  'Lumpy',
  'Meaty',
  'Fizzy',
  'Nervous',
  'Crumbly',
  'Oozy',
  'Dank',
  'Wheezy',
  'Jiggly',
  'Mild',
  'Chilly',
  'Pungent',
  'Tragic',
  'Frilly',
  'Melty',
  'Loafy',
  'Honkable',
  'Farty',
];

export const npcVillageNameNouns: string[] = [
  'Hill',
  'Ford',
  'Cliff',
  'Knoll',
  'Creek',
  'Marsh',
  'Ridge',
  'Moor',
  'Glen',
  'Plains',
  'Woods',
  'Field',
  'Knob',
  'Wastes',
  'Hollow',
  'Pit',
  'Haven',
  'Borough',
  'Valley',
  'Town',
  'Bridge',
  'Fort',
  'Crossing',
  'Falls',
  'Fjord',
  'Crag',
  'Shire',
  'Bluff',
  'Cairn',
  'Pass',
  'Ditch',
  'Bay',
  'Lagoon',
  'Spire',
  'Summit',
  'Thicket',
  'Mire',
  'Arch',
  'Chasm',
  'Corridor',
  'Steps',
  'Gorge',
  'Sprawl',
  'Meadow',
  'Furnace',
  'Yard',
  'Roost',
  'Nest',
  'Burrow',
  'Oasis',
  'Terrace',
  'Vault',
  'Landing',
  'Nook',
];

export type BuildingField = {
  field_id: number;
  building_id: Building['id'];
  level: number;
};

type ResourceFieldMap = Map<number, Building['id']>;

// Wheat that never changes
const staticWheatFields = new Map<number, Building['id']>([
  [2, 'WHEAT_FIELD'],
  [8, 'WHEAT_FIELD'],
  [9, 'WHEAT_FIELD'],
  [12, 'WHEAT_FIELD'],
  [13, 'WHEAT_FIELD'],
  [15, 'WHEAT_FIELD'],
]);

// Fixed non-wheat positions on all RFCs except "00018"
const staticResourcesLayout = new Map<number, Building['id']>([
  [3, 'WOODCUTTER'],
  [4, 'IRON_MINE'],
  [6, 'CLAY_PIT'],
  [7, 'IRON_MINE'],
  [11, 'IRON_MINE'],
  [14, 'WOODCUTTER'],
  [16, 'CLAY_PIT'],
  [17, 'WOODCUTTER'],
  [18, 'CLAY_PIT'],
]);

// Build a new map from static layouts + overrides
const base = (overrides: [number, Building['id']][]): ResourceFieldMap => {
  return new Map<number, Building['id']>([
    ...staticWheatFields,
    ...staticResourcesLayout,
    ...overrides,
  ]);
};

const at = (
  a: Building['id'],
  b: Building['id'],
  c: Building['id'],
): ResourceFieldMap =>
  base([
    [1, a],
    [5, b],
    [10, c],
  ]);

const resourceFieldsLayouts: Record<
  ResourceFieldComposition,
  ResourceFieldMap
> = {
  '3456': at('IRON_MINE', 'CLAY_PIT', 'IRON_MINE'),
  '3546': at('CLAY_PIT', 'CLAY_PIT', 'IRON_MINE'),
  '4356': at('WOODCUTTER', 'IRON_MINE', 'IRON_MINE'),
  '4536': at('WOODCUTTER', 'CLAY_PIT', 'CLAY_PIT'),
  '5346': at('WOODCUTTER', 'WOODCUTTER', 'IRON_MINE'),
  '5436': at('WOODCUTTER', 'CLAY_PIT', 'WOODCUTTER'),
  '4446': at('WOODCUTTER', 'CLAY_PIT', 'IRON_MINE'),
  '4437': at('WOODCUTTER', 'CLAY_PIT', 'WHEAT_FIELD'),
  '4347': at('WOODCUTTER', 'WHEAT_FIELD', 'IRON_MINE'),
  '3447': at('WHEAT_FIELD', 'CLAY_PIT', 'IRON_MINE'),
  '3339': at('WHEAT_FIELD', 'WHEAT_FIELD', 'WHEAT_FIELD'),

  // “mostly wheat” exceptions, build them directly
  '11115': new Map<number, Building['id']>([
    [1, 'WHEAT_FIELD'],
    [2, 'WHEAT_FIELD'],
    [3, 'WOODCUTTER'],
    [4, 'IRON_MINE'],
    [5, 'WHEAT_FIELD'],
    [6, 'WHEAT_FIELD'],
    [7, 'WHEAT_FIELD'],
    [8, 'WHEAT_FIELD'],
    [9, 'WHEAT_FIELD'],
    [10, 'WHEAT_FIELD'],
    [11, 'WHEAT_FIELD'],
    [12, 'WHEAT_FIELD'],
    [13, 'WHEAT_FIELD'],
    [14, 'WHEAT_FIELD'],
    [15, 'WHEAT_FIELD'],
    [16, 'CLAY_PIT'],
    [17, 'WHEAT_FIELD'],
    [18, 'WHEAT_FIELD'],
  ]),

  '00018': new Map<number, Building['id']>([
    [1, 'WHEAT_FIELD'],
    [2, 'WHEAT_FIELD'],
    [3, 'WHEAT_FIELD'],
    [4, 'WHEAT_FIELD'],
    [5, 'WHEAT_FIELD'],
    [6, 'WHEAT_FIELD'],
    [7, 'WHEAT_FIELD'],
    [8, 'WHEAT_FIELD'],
    [9, 'WHEAT_FIELD'],
    [10, 'WHEAT_FIELD'],
    [11, 'WHEAT_FIELD'],
    [12, 'WHEAT_FIELD'],
    [13, 'WHEAT_FIELD'],
    [14, 'WHEAT_FIELD'],
    [15, 'WHEAT_FIELD'],
    [16, 'WHEAT_FIELD'],
    [17, 'WHEAT_FIELD'],
    [18, 'WHEAT_FIELD'],
  ]),
};

const getResourceFieldComposition = (
  resourceFieldComposition: ResourceFieldComposition,
): ResourceFieldMap => {
  return resourceFieldsLayouts[resourceFieldComposition];
};

const tribeToWallBuildingIdMap = new Map<Tribe, Building['id']>([
  ['romans', 'ROMAN_WALL'],
  ['gauls', 'GAUL_WALL'],
  ['teutons', 'TEUTONIC_WALL'],
  ['huns', 'HUN_WALL'],
  ['egyptians', 'EGYPTIAN_WALL'],
  ['spartans', 'SPARTAN_WALL'],
  ['nature', 'NATURE_WALL'],
  ['natars', 'NATAR_WALL'],
]);

const getWallBuildingId = (tribe: Tribe): Building['id'] => {
  return tribeToWallBuildingIdMap.get(tribe)!;
};

const villageSizeToWallLevelMap = new Map<VillageSize | 'player', number>([
  ['player', 0],
  ['xxs', 5],
  ['xs', 5],
  ['sm', 10],
  ['md', 15],
  ['lg', 20],
  ['xl', 20],
  ['2xl', 20],
  ['3xl', 20],
  ['4xl', 20],
]);

const getWallBuildingLevel = (villageSize: VillageSize | 'player'): number => {
  return villageSizeToWallLevelMap.get(villageSize)!;
};

const villageSizeToResourceFieldsLevelMap = new Map<
  VillageSize | 'player',
  number
>([
  ['player', 0],
  ['xxs', 3],
  ['xs', 4],
  ['sm', 6],
  ['md', 8],
  ['lg', 10],
  ['xl', 12],
  ['2xl', 14],
  ['3xl', 16],
  ['4xl', 18],
]);

const getResourceBuildingsLevel = (
  villageSize: VillageSize | 'player',
): number => {
  return villageSizeToResourceFieldsLevelMap.get(villageSize)!;
};

const villageSizeToVillageBuildingFieldsMap = new Map<
  VillageSize | 'player',
  BuildingField[]
>([
  [
    'player',
    [
      { field_id: 38, building_id: 'MAIN_BUILDING', level: 1 },
      { field_id: 39, building_id: 'RALLY_POINT', level: 1 },
    ],
  ],
  [
    'xxs',
    [
      { field_id: 26, building_id: 'WAREHOUSE', level: 2 },
      { field_id: 27, building_id: 'GRANARY', level: 1 },
      { field_id: 31, building_id: 'CRANNY', level: 2 },
      { field_id: 38, building_id: 'MAIN_BUILDING', level: 2 },
      { field_id: 39, building_id: 'RALLY_POINT', level: 1 },
    ],
  ],
  [
    'xs',
    [
      { field_id: 26, building_id: 'WAREHOUSE', level: 3 },
      { field_id: 27, building_id: 'GRANARY', level: 2 },
      { field_id: 30, building_id: 'EMBASSY', level: 1 },
      { field_id: 31, building_id: 'CRANNY', level: 3 },
      { field_id: 32, building_id: 'MARKETPLACE', level: 1 },
      { field_id: 38, building_id: 'MAIN_BUILDING', level: 4 },
      { field_id: 39, building_id: 'RALLY_POINT', level: 2 },
    ],
  ],
  [
    'sm',
    [
      { field_id: 22, building_id: 'BARRACKS', level: 3 },
      { field_id: 23, building_id: 'RESIDENCE', level: 4 },
      { field_id: 24, building_id: 'ACADEMY', level: 2 },
      { field_id: 25, building_id: 'SMITHY', level: 2 },
      { field_id: 26, building_id: 'WAREHOUSE', level: 6 },
      { field_id: 27, building_id: 'GRANARY', level: 5 },
      { field_id: 30, building_id: 'EMBASSY', level: 3 },
      { field_id: 31, building_id: 'CRANNY', level: 5 },
      { field_id: 32, building_id: 'MARKETPLACE', level: 3 },
      { field_id: 38, building_id: 'MAIN_BUILDING', level: 7 },
      { field_id: 39, building_id: 'RALLY_POINT', level: 3 },
    ],
  ],
  [
    'md',
    [
      { field_id: 21, building_id: 'TOWN_HALL', level: 1 },
      { field_id: 22, building_id: 'BARRACKS', level: 6 },
      { field_id: 23, building_id: 'RESIDENCE', level: 7 },
      { field_id: 24, building_id: 'ACADEMY', level: 5 },
      { field_id: 25, building_id: 'SMITHY', level: 4 },
      { field_id: 26, building_id: 'WAREHOUSE', level: 10 },
      { field_id: 27, building_id: 'GRANARY', level: 9 },
      { field_id: 30, building_id: 'EMBASSY', level: 5 },
      { field_id: 31, building_id: 'CRANNY', level: 6 },
      { field_id: 32, building_id: 'MARKETPLACE', level: 7 },
      { field_id: 33, building_id: 'STABLE', level: 3 },
      { field_id: 34, building_id: 'WORKSHOP', level: 1 },
      { field_id: 38, building_id: 'MAIN_BUILDING', level: 10 },
      { field_id: 39, building_id: 'RALLY_POINT', level: 5 },
    ],
  ],
  [
    'lg',
    [
      { field_id: 19, building_id: 'TOURNAMENT_SQUARE', level: 4 },
      { field_id: 20, building_id: 'HOSPITAL', level: 3 },
      { field_id: 21, building_id: 'TOWN_HALL', level: 4 },
      { field_id: 22, building_id: 'BARRACKS', level: 10 },
      { field_id: 23, building_id: 'RESIDENCE', level: 10 },
      { field_id: 24, building_id: 'ACADEMY', level: 8 },
      { field_id: 25, building_id: 'SMITHY', level: 7 },
      { field_id: 26, building_id: 'WAREHOUSE', level: 15 },
      { field_id: 27, building_id: 'GRANARY', level: 14 },
      { field_id: 28, building_id: 'HEROS_MANSION', level: 6 },
      { field_id: 29, building_id: 'TREASURY', level: 3 },
      { field_id: 30, building_id: 'EMBASSY', level: 7 },
      { field_id: 31, building_id: 'CRANNY', level: 7 },
      { field_id: 32, building_id: 'MARKETPLACE', level: 11 },
      { field_id: 33, building_id: 'STABLE', level: 7 },
      { field_id: 34, building_id: 'WORKSHOP', level: 4 },
      { field_id: 38, building_id: 'MAIN_BUILDING', level: 13 },
      { field_id: 39, building_id: 'RALLY_POINT', level: 7 },
    ],
  ],
  [
    'xl',
    [
      { field_id: 19, building_id: 'TOURNAMENT_SQUARE', level: 8 },
      { field_id: 20, building_id: 'HOSPITAL', level: 6 },
      { field_id: 21, building_id: 'TOWN_HALL', level: 7 },
      { field_id: 22, building_id: 'BARRACKS', level: 14 },
      { field_id: 23, building_id: 'RESIDENCE', level: 14 },
      { field_id: 24, building_id: 'ACADEMY', level: 11 },
      { field_id: 25, building_id: 'SMITHY', level: 10 },
      { field_id: 26, building_id: 'WAREHOUSE', level: 19 },
      { field_id: 27, building_id: 'GRANARY', level: 18 },
      { field_id: 28, building_id: 'HEROS_MANSION', level: 10 },
      { field_id: 29, building_id: 'TREASURY', level: 6 },
      { field_id: 30, building_id: 'EMBASSY', level: 9 },
      { field_id: 31, building_id: 'CRANNY', level: 8 },
      { field_id: 32, building_id: 'MARKETPLACE', level: 14 },
      { field_id: 33, building_id: 'STABLE', level: 11 },
      { field_id: 34, building_id: 'WORKSHOP', level: 7 },
      { field_id: 35, building_id: 'BRICKYARD', level: 3 },
      { field_id: 36, building_id: 'SAWMILL', level: 3 },
      { field_id: 37, building_id: 'TRADE_OFFICE', level: 5 },
      { field_id: 38, building_id: 'MAIN_BUILDING', level: 16 },
      { field_id: 39, building_id: 'RALLY_POINT', level: 10 },
    ],
  ],
  [
    '2xl',
    [
      { field_id: 19, building_id: 'TOURNAMENT_SQUARE', level: 12 },
      { field_id: 20, building_id: 'HOSPITAL', level: 8 },
      { field_id: 21, building_id: 'TOWN_HALL', level: 10 },
      { field_id: 22, building_id: 'BARRACKS', level: 17 },
      { field_id: 23, building_id: 'RESIDENCE', level: 16 },
      { field_id: 24, building_id: 'ACADEMY', level: 14 },
      { field_id: 25, building_id: 'SMITHY', level: 13 },
      { field_id: 26, building_id: 'WAREHOUSE', level: 20 },
      { field_id: 27, building_id: 'GRANARY', level: 20 },
      { field_id: 28, building_id: 'HEROS_MANSION', level: 13 },
      { field_id: 29, building_id: 'TREASURY', level: 8 },
      { field_id: 30, building_id: 'EMBASSY', level: 11 },
      { field_id: 31, building_id: 'CRANNY', level: 9 },
      { field_id: 32, building_id: 'MARKETPLACE', level: 17 },
      { field_id: 33, building_id: 'STABLE', level: 14 },
      { field_id: 34, building_id: 'WORKSHOP', level: 10 },
      { field_id: 35, building_id: 'BRICKYARD', level: 5 },
      { field_id: 36, building_id: 'SAWMILL', level: 5 },
      { field_id: 37, building_id: 'TRADE_OFFICE', level: 8 },
      { field_id: 38, building_id: 'MAIN_BUILDING', level: 18 },
      { field_id: 39, building_id: 'RALLY_POINT', level: 12 },
    ],
  ],
  [
    '3xl',
    [
      { field_id: 19, building_id: 'TOURNAMENT_SQUARE', level: 15 },
      { field_id: 20, building_id: 'HOSPITAL', level: 10 },
      { field_id: 21, building_id: 'TOWN_HALL', level: 13 },
      { field_id: 22, building_id: 'BARRACKS', level: 19 },
      { field_id: 23, building_id: 'RESIDENCE', level: 18 },
      { field_id: 24, building_id: 'ACADEMY', level: 16 },
      { field_id: 25, building_id: 'SMITHY', level: 15 },
      { field_id: 26, building_id: 'WAREHOUSE', level: 20 },
      { field_id: 27, building_id: 'GRANARY', level: 20 },
      { field_id: 28, building_id: 'HEROS_MANSION', level: 16 },
      { field_id: 29, building_id: 'TREASURY', level: 10 },
      { field_id: 30, building_id: 'EMBASSY', level: 13 },
      { field_id: 31, building_id: 'CRANNY', level: 10 },
      { field_id: 32, building_id: 'MARKETPLACE', level: 19 },
      { field_id: 33, building_id: 'STABLE', level: 17 },
      { field_id: 34, building_id: 'WORKSHOP', level: 13 },
      { field_id: 35, building_id: 'BRICKYARD', level: 5 },
      { field_id: 36, building_id: 'SAWMILL', level: 5 },
      { field_id: 37, building_id: 'TRADE_OFFICE', level: 11 },
      { field_id: 38, building_id: 'MAIN_BUILDING', level: 19 },
      { field_id: 39, building_id: 'RALLY_POINT', level: 15 },
    ],
  ],
  [
    '4xl',
    [
      { field_id: 19, building_id: 'TOURNAMENT_SQUARE', level: 20 },
      { field_id: 20, building_id: 'HOSPITAL', level: 12 },
      { field_id: 21, building_id: 'TOWN_HALL', level: 15 },
      { field_id: 22, building_id: 'BARRACKS', level: 20 },
      { field_id: 23, building_id: 'RESIDENCE', level: 20 },
      { field_id: 24, building_id: 'ACADEMY', level: 20 },
      { field_id: 25, building_id: 'SMITHY', level: 20 },
      { field_id: 26, building_id: 'WAREHOUSE', level: 20 },
      { field_id: 27, building_id: 'GRANARY', level: 20 },
      { field_id: 28, building_id: 'HEROS_MANSION', level: 20 },
      { field_id: 29, building_id: 'TREASURY', level: 12 },
      { field_id: 30, building_id: 'EMBASSY', level: 15 },
      { field_id: 31, building_id: 'CRANNY', level: 10 },
      { field_id: 32, building_id: 'MARKETPLACE', level: 20 },
      { field_id: 33, building_id: 'STABLE', level: 20 },
      { field_id: 34, building_id: 'WORKSHOP', level: 15 },
      { field_id: 35, building_id: 'BRICKYARD', level: 5 },
      { field_id: 36, building_id: 'SAWMILL', level: 5 },
      { field_id: 37, building_id: 'TRADE_OFFICE', level: 14 },
      { field_id: 38, building_id: 'MAIN_BUILDING', level: 20 },
      { field_id: 39, building_id: 'RALLY_POINT', level: 20 },
    ],
  ],
]);

const getVillageBuildingFields = (
  villageSize: VillageSize | 'player',
): BuildingField[] => {
  return villageSizeToVillageBuildingFieldsMap.get(villageSize)!;
};

export const buildingFieldsFactory = (
  villageSize: VillageSize | 'player',
  tribe: Tribe,
  resourceFieldComposition: ResourceFieldComposition,
): BuildingField[] => {
  const wallBuildingLevel = getWallBuildingLevel(villageSize);
  const wallBuildingId = getWallBuildingId(tribe);
  const resourceBuildingsLevel = getResourceBuildingsLevel(villageSize);
  const rfc = getResourceFieldComposition(resourceFieldComposition);
  const villageBuildingFields = getVillageBuildingFields(villageSize);

  return [
    // Resource fields
    ...Array.from(
      rfc,
      ([buildingFieldId, buildingId]) =>
        ({
          building_id: buildingId,
          level: resourceBuildingsLevel,
          field_id: buildingFieldId,
        }) satisfies BuildingField,
    ),
    // Village fields
    ...villageBuildingFields,
    // Wall
    { building_id: wallBuildingId, field_id: 40, level: wallBuildingLevel },
  ];
};
