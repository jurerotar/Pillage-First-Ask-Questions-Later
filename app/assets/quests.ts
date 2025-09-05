import type {
  GlobalQuest,
  VillageQuest,
} from 'app/interfaces/models/game/quest';
import type { Building } from 'app/interfaces/models/game/building';
import type { Village } from 'app/interfaces/models/game/village';

const createTroopCountQuest = (count: number): GlobalQuest => {
  return {
    id: `troopCount-${count}`,
    scope: 'global',
    requirements: [
      {
        type: 'troop-count',
        count,
      },
    ],
    rewards: [
      {
        type: 'resources',
        amount: count * 10,
      },
    ],
    completedAt: null,
    collectedAt: null,
  };
};

const createAdventureCountQuest = (count: number): GlobalQuest => {
  return {
    id: `adventureCount-${count}`,
    scope: 'global',
    requirements: [
      {
        type: 'adventure-count',
        count,
      },
    ],
    rewards: [
      {
        type: 'hero-exp',
        amount: count * 10,
      },
    ],
    completedAt: null,
    collectedAt: null,
  };
};

export const globalQuests: GlobalQuest[] = [
  createAdventureCountQuest(1),
  createAdventureCountQuest(3),
  createAdventureCountQuest(5),
  createAdventureCountQuest(10),
  createAdventureCountQuest(15),
  createAdventureCountQuest(20),
  createAdventureCountQuest(30),
  createAdventureCountQuest(50),
  createAdventureCountQuest(75),
  createAdventureCountQuest(100),
  createAdventureCountQuest(125),
  createAdventureCountQuest(150),
  createAdventureCountQuest(175),
  createAdventureCountQuest(200),
  createAdventureCountQuest(250),
  createAdventureCountQuest(300),
  createAdventureCountQuest(350),
  createAdventureCountQuest(400),
  createAdventureCountQuest(450),
  createAdventureCountQuest(500),
  createTroopCountQuest(5),
  createTroopCountQuest(10),
  createTroopCountQuest(25),
  createTroopCountQuest(50),
  createTroopCountQuest(100),
  createTroopCountQuest(200),
  createTroopCountQuest(350),
  createTroopCountQuest(500),
];

const buildingIdToResourceRewardMap = new Map<Building['id'], number>([
  ['WOODCUTTER', 100],
  ['CLAY_PIT', 150],
  ['IRON_MINE', 120],
  ['WHEAT_FIELD', 80],
  ['MAIN_BUILDING', 150],
  ['WAREHOUSE', 100],
  ['GRANARY', 100],
  ['BARRACKS', 150],
  ['STABLE', 180],
  ['CRANNY', 90],
  ['MARKETPLACE', 110],
  // ['SMITHY', 150],
  ['ACADEMY', 140],
  ['HEROS_MANSION', 150],
  ['RALLY_POINT', 120],
  ['SAWMILL', 200],
  ['BRICKYARD', 200],
  ['IRON_FOUNDRY', 200],
  ['GRAIN_MILL', 200],
  ['BAKERY', 200],
  ['CITY_WALL', 150],
  ['EARTH_WALL', 150],
  ['MAKESHIFT_WALL', 150],
  ['STONE_WALL', 150],
  ['PALISADE', 150],
]);

const calculateResourceReward = (
  buildingId: Building['id'],
  level: number,
  matcher: 'oneOf' | 'every',
): number => {
  const base = buildingIdToResourceRewardMap.get(buildingId)!;
  const effectiveLevel = level - 1;
  if (matcher === 'oneOf') {
    return Math.round(base * effectiveLevel) + base / 2;
  }

  const exponent = 1.3;
  return Math.round(base * effectiveLevel ** exponent) + base / 2;
};

export const createBuildingQuest = (
  villageId: Village['id'],
  buildingId: Building['id'],
  level: number,
  matcher: 'oneOf' | 'every' = 'oneOf',
  reward?: number,
): VillageQuest => {
  return {
    id: `${villageId}-${buildingId}-${matcher}-${level}`,
    villageId,
    scope: 'village',
    requirements: [
      {
        type: 'building',
        buildingId,
        level,
        matcher,
      },
    ],
    rewards: [
      {
        type: 'resources',
        amount: reward ?? calculateResourceReward(buildingId, level, matcher),
      },
    ],
    completedAt: null,
    collectedAt: null,
  };
};

export const generateVillageQuests = (
  villageId: Village['id'],
): VillageQuest[] => [
  // Wood
  createBuildingQuest(villageId, 'WOODCUTTER', 1),
  createBuildingQuest(villageId, 'WOODCUTTER', 2),
  createBuildingQuest(villageId, 'WOODCUTTER', 4),
  createBuildingQuest(villageId, 'WOODCUTTER', 6),
  createBuildingQuest(villageId, 'WOODCUTTER', 8),
  createBuildingQuest(villageId, 'WOODCUTTER', 10),
  createBuildingQuest(villageId, 'WOODCUTTER', 1, 'every'),
  createBuildingQuest(villageId, 'WOODCUTTER', 3, 'every'),
  createBuildingQuest(villageId, 'WOODCUTTER', 5, 'every'),
  createBuildingQuest(villageId, 'WOODCUTTER', 7, 'every'),
  createBuildingQuest(villageId, 'WOODCUTTER', 9, 'every'),
  // Clay
  createBuildingQuest(villageId, 'CLAY_PIT', 1),
  createBuildingQuest(villageId, 'CLAY_PIT', 2),
  createBuildingQuest(villageId, 'CLAY_PIT', 4),
  createBuildingQuest(villageId, 'CLAY_PIT', 6),
  createBuildingQuest(villageId, 'CLAY_PIT', 8),
  createBuildingQuest(villageId, 'CLAY_PIT', 10),
  createBuildingQuest(villageId, 'CLAY_PIT', 1, 'every'),
  createBuildingQuest(villageId, 'CLAY_PIT', 3, 'every'),
  createBuildingQuest(villageId, 'CLAY_PIT', 5, 'every'),
  createBuildingQuest(villageId, 'CLAY_PIT', 7, 'every'),
  createBuildingQuest(villageId, 'CLAY_PIT', 9, 'every'),
  // Iron
  createBuildingQuest(villageId, 'IRON_MINE', 1),
  createBuildingQuest(villageId, 'IRON_MINE', 2),
  createBuildingQuest(villageId, 'IRON_MINE', 4),
  createBuildingQuest(villageId, 'IRON_MINE', 6),
  createBuildingQuest(villageId, 'IRON_MINE', 8),
  createBuildingQuest(villageId, 'IRON_MINE', 10),
  createBuildingQuest(villageId, 'IRON_MINE', 1, 'every'),
  createBuildingQuest(villageId, 'IRON_MINE', 3, 'every'),
  createBuildingQuest(villageId, 'IRON_MINE', 5, 'every'),
  createBuildingQuest(villageId, 'IRON_MINE', 7, 'every'),
  createBuildingQuest(villageId, 'IRON_MINE', 9, 'every'),
  // Wheat
  createBuildingQuest(villageId, 'WHEAT_FIELD', 1),
  createBuildingQuest(villageId, 'WHEAT_FIELD', 2),
  createBuildingQuest(villageId, 'WHEAT_FIELD', 4),
  createBuildingQuest(villageId, 'WHEAT_FIELD', 6),
  createBuildingQuest(villageId, 'WHEAT_FIELD', 8),
  createBuildingQuest(villageId, 'WHEAT_FIELD', 10),
  createBuildingQuest(villageId, 'WHEAT_FIELD', 1, 'every'),
  createBuildingQuest(villageId, 'WHEAT_FIELD', 3, 'every'),
  createBuildingQuest(villageId, 'WHEAT_FIELD', 5, 'every'),
  createBuildingQuest(villageId, 'WHEAT_FIELD', 7, 'every'),
  createBuildingQuest(villageId, 'WHEAT_FIELD', 9, 'every'),
  // Main building
  createBuildingQuest(villageId, 'MAIN_BUILDING', 5),
  createBuildingQuest(villageId, 'MAIN_BUILDING', 10),
  createBuildingQuest(villageId, 'MAIN_BUILDING', 15),
  createBuildingQuest(villageId, 'MAIN_BUILDING', 20),
  // Warehouse
  createBuildingQuest(villageId, 'WAREHOUSE', 1),
  createBuildingQuest(villageId, 'WAREHOUSE', 5),
  createBuildingQuest(villageId, 'WAREHOUSE', 10),
  createBuildingQuest(villageId, 'WAREHOUSE', 15),
  createBuildingQuest(villageId, 'WAREHOUSE', 20),
  // Granary
  createBuildingQuest(villageId, 'GRANARY', 1),
  createBuildingQuest(villageId, 'GRANARY', 5),
  createBuildingQuest(villageId, 'GRANARY', 10),
  createBuildingQuest(villageId, 'GRANARY', 15),
  createBuildingQuest(villageId, 'GRANARY', 20),
  // Marketplace
  createBuildingQuest(villageId, 'MARKETPLACE', 1),
  createBuildingQuest(villageId, 'MARKETPLACE', 5),
  createBuildingQuest(villageId, 'MARKETPLACE', 10),
  createBuildingQuest(villageId, 'MARKETPLACE', 15),
  createBuildingQuest(villageId, 'MARKETPLACE', 20),
  // Barracks
  createBuildingQuest(villageId, 'BARRACKS', 1),
  createBuildingQuest(villageId, 'BARRACKS', 5),
  createBuildingQuest(villageId, 'BARRACKS', 10),
  createBuildingQuest(villageId, 'BARRACKS', 15),
  createBuildingQuest(villageId, 'BARRACKS', 20),
  // Stable
  createBuildingQuest(villageId, 'STABLE', 1),
  createBuildingQuest(villageId, 'STABLE', 5),
  createBuildingQuest(villageId, 'STABLE', 10),
  createBuildingQuest(villageId, 'STABLE', 15),
  createBuildingQuest(villageId, 'STABLE', 20),
  // Rally point
  createBuildingQuest(villageId, 'RALLY_POINT', 5),
  createBuildingQuest(villageId, 'RALLY_POINT', 10),
  createBuildingQuest(villageId, 'RALLY_POINT', 15),
  createBuildingQuest(villageId, 'RALLY_POINT', 20),
  // Academy
  createBuildingQuest(villageId, 'ACADEMY', 1),
  createBuildingQuest(villageId, 'ACADEMY', 5),
  createBuildingQuest(villageId, 'ACADEMY', 10),
  createBuildingQuest(villageId, 'ACADEMY', 15),
  createBuildingQuest(villageId, 'ACADEMY', 20),
  // Smithy
  createBuildingQuest(villageId, 'SMITHY', 1),
  createBuildingQuest(villageId, 'SMITHY', 5),
  createBuildingQuest(villageId, 'SMITHY', 10),
  createBuildingQuest(villageId, 'SMITHY', 15),
  createBuildingQuest(villageId, 'SMITHY', 20),
  // Hero's mansion
  createBuildingQuest(villageId, 'HEROS_MANSION', 10),
  createBuildingQuest(villageId, 'HEROS_MANSION', 15),
  createBuildingQuest(villageId, 'HEROS_MANSION', 20),
  // Cranny
  createBuildingQuest(villageId, 'CRANNY', 1),
  createBuildingQuest(villageId, 'CRANNY', 3),
  createBuildingQuest(villageId, 'CRANNY', 7),
  createBuildingQuest(villageId, 'CRANNY', 10),
  // Sawmill
  createBuildingQuest(villageId, 'SAWMILL', 1),
  createBuildingQuest(villageId, 'SAWMILL', 3),
  createBuildingQuest(villageId, 'SAWMILL', 5),
  // Brickyard
  createBuildingQuest(villageId, 'BRICKYARD', 1),
  createBuildingQuest(villageId, 'BRICKYARD', 3),
  createBuildingQuest(villageId, 'BRICKYARD', 5),
  // Iron foundry
  createBuildingQuest(villageId, 'IRON_FOUNDRY', 1),
  createBuildingQuest(villageId, 'IRON_FOUNDRY', 3),
  createBuildingQuest(villageId, 'IRON_FOUNDRY', 5),
  // Grain mill
  createBuildingQuest(villageId, 'GRAIN_MILL', 1),
  createBuildingQuest(villageId, 'GRAIN_MILL', 3),
  createBuildingQuest(villageId, 'GRAIN_MILL', 5),
  // Bakery
  createBuildingQuest(villageId, 'BAKERY', 1),
  createBuildingQuest(villageId, 'BAKERY', 3),
  createBuildingQuest(villageId, 'BAKERY', 5),
];
