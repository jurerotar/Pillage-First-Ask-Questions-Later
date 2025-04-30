import type { Quest, VillageQuest } from 'app/interfaces/models/game/quest';
import type { Building } from 'app/interfaces/models/game/building';

const createTroopCountQuest = (count: number): Quest => {
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

const createAdventureCountQuest = (count: number): Quest => {
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

export const globalQuests: Quest[] = [
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

const calculateResourceReward = (buildingId: Building['id'], level: number, matcher: 'oneOf' | 'every'): number => {
  const base = buildingIdToResourceRewardMap.get(buildingId)!;
  const effectiveLevel = level - 1;
  if (matcher === 'oneOf') {
    return Math.round(base * effectiveLevel) + base / 2;
  }

  const exponent = 1.3;
  return Math.round(base * effectiveLevel ** exponent) + base / 2;
};

export const createBuildingQuest = (
  buildingId: Building['id'],
  level: number,
  matcher: 'oneOf' | 'every' = 'oneOf',
  reward?: number,
): Omit<VillageQuest, 'villageId'> => {
  return {
    id: `${buildingId}-${matcher}-${level}`,
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

export const villageQuests: Omit<VillageQuest, 'villageId'>[] = [
  // Wood
  createBuildingQuest('WOODCUTTER', 1),
  createBuildingQuest('WOODCUTTER', 2),
  createBuildingQuest('WOODCUTTER', 4),
  createBuildingQuest('WOODCUTTER', 6),
  createBuildingQuest('WOODCUTTER', 8),
  createBuildingQuest('WOODCUTTER', 10),
  createBuildingQuest('WOODCUTTER', 1, 'every'),
  createBuildingQuest('WOODCUTTER', 3, 'every'),
  createBuildingQuest('WOODCUTTER', 5, 'every'),
  createBuildingQuest('WOODCUTTER', 7, 'every'),
  createBuildingQuest('WOODCUTTER', 9, 'every'),
  // Clay
  createBuildingQuest('CLAY_PIT', 1),
  createBuildingQuest('CLAY_PIT', 2),
  createBuildingQuest('CLAY_PIT', 4),
  createBuildingQuest('CLAY_PIT', 6),
  createBuildingQuest('CLAY_PIT', 8),
  createBuildingQuest('CLAY_PIT', 10),
  createBuildingQuest('CLAY_PIT', 1, 'every'),
  createBuildingQuest('CLAY_PIT', 3, 'every'),
  createBuildingQuest('CLAY_PIT', 5, 'every'),
  createBuildingQuest('CLAY_PIT', 7, 'every'),
  createBuildingQuest('CLAY_PIT', 9, 'every'),
  // Iron
  createBuildingQuest('IRON_MINE', 1),
  createBuildingQuest('IRON_MINE', 2),
  createBuildingQuest('IRON_MINE', 4),
  createBuildingQuest('IRON_MINE', 6),
  createBuildingQuest('IRON_MINE', 8),
  createBuildingQuest('IRON_MINE', 10),
  createBuildingQuest('IRON_MINE', 1, 'every'),
  createBuildingQuest('IRON_MINE', 3, 'every'),
  createBuildingQuest('IRON_MINE', 5, 'every'),
  createBuildingQuest('IRON_MINE', 7, 'every'),
  createBuildingQuest('IRON_MINE', 9, 'every'),
  // Wheat
  createBuildingQuest('WHEAT_FIELD', 1),
  createBuildingQuest('WHEAT_FIELD', 2),
  createBuildingQuest('WHEAT_FIELD', 4),
  createBuildingQuest('WHEAT_FIELD', 6),
  createBuildingQuest('WHEAT_FIELD', 8),
  createBuildingQuest('WHEAT_FIELD', 10),
  createBuildingQuest('WHEAT_FIELD', 1, 'every'),
  createBuildingQuest('WHEAT_FIELD', 3, 'every'),
  createBuildingQuest('WHEAT_FIELD', 5, 'every'),
  createBuildingQuest('WHEAT_FIELD', 7, 'every'),
  createBuildingQuest('WHEAT_FIELD', 9, 'every'),
  // Main building
  createBuildingQuest('MAIN_BUILDING', 5),
  createBuildingQuest('MAIN_BUILDING', 10),
  createBuildingQuest('MAIN_BUILDING', 15),
  createBuildingQuest('MAIN_BUILDING', 20),
  // Warehouse
  createBuildingQuest('WAREHOUSE', 1),
  createBuildingQuest('WAREHOUSE', 5),
  createBuildingQuest('WAREHOUSE', 10),
  createBuildingQuest('WAREHOUSE', 15),
  createBuildingQuest('WAREHOUSE', 20),
  // Granary
  createBuildingQuest('GRANARY', 1),
  createBuildingQuest('GRANARY', 5),
  createBuildingQuest('GRANARY', 10),
  createBuildingQuest('GRANARY', 15),
  createBuildingQuest('GRANARY', 20),
  // Marketplace
  createBuildingQuest('MARKETPLACE', 1),
  createBuildingQuest('MARKETPLACE', 5),
  createBuildingQuest('MARKETPLACE', 10),
  createBuildingQuest('MARKETPLACE', 15),
  createBuildingQuest('MARKETPLACE', 20),
  // Barracks
  createBuildingQuest('BARRACKS', 1),
  createBuildingQuest('BARRACKS', 5),
  createBuildingQuest('BARRACKS', 10),
  createBuildingQuest('BARRACKS', 15),
  createBuildingQuest('BARRACKS', 20),
  // Stable
  createBuildingQuest('STABLE', 1),
  createBuildingQuest('STABLE', 5),
  createBuildingQuest('STABLE', 10),
  createBuildingQuest('STABLE', 15),
  createBuildingQuest('STABLE', 20),
  // Rally point
  createBuildingQuest('RALLY_POINT', 5),
  createBuildingQuest('RALLY_POINT', 10),
  createBuildingQuest('RALLY_POINT', 15),
  createBuildingQuest('RALLY_POINT', 20),
  // Academy
  createBuildingQuest('ACADEMY', 1),
  createBuildingQuest('ACADEMY', 5),
  createBuildingQuest('ACADEMY', 10),
  createBuildingQuest('ACADEMY', 15),
  createBuildingQuest('ACADEMY', 20),
  // Smithy
  // createBuildingQuest('SMITHY', 1),
  // createBuildingQuest('SMITHY', 5),
  // createBuildingQuest('SMITHY', 10),
  // createBuildingQuest('SMITHY', 15),
  // createBuildingQuest('SMITHY', 20),
  // Hero's mansion
  createBuildingQuest('HEROS_MANSION', 10),
  createBuildingQuest('HEROS_MANSION', 15),
  createBuildingQuest('HEROS_MANSION', 20),
  // Cranny
  createBuildingQuest('CRANNY', 1),
  createBuildingQuest('CRANNY', 3),
  createBuildingQuest('CRANNY', 7),
  createBuildingQuest('CRANNY', 10),
  // Sawmill
  createBuildingQuest('SAWMILL', 1),
  createBuildingQuest('SAWMILL', 3),
  createBuildingQuest('SAWMILL', 5),
  // Brickyard
  createBuildingQuest('BRICKYARD', 1),
  createBuildingQuest('BRICKYARD', 3),
  createBuildingQuest('BRICKYARD', 5),
  // Iron foundry
  createBuildingQuest('IRON_FOUNDRY', 1),
  createBuildingQuest('IRON_FOUNDRY', 3),
  createBuildingQuest('IRON_FOUNDRY', 5),
  // Grain mill
  createBuildingQuest('GRAIN_MILL', 1),
  createBuildingQuest('GRAIN_MILL', 3),
  createBuildingQuest('GRAIN_MILL', 5),
  // Bakery
  createBuildingQuest('BAKERY', 1),
  createBuildingQuest('BAKERY', 3),
  createBuildingQuest('BAKERY', 5),
];
