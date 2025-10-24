import type {
  GlobalQuest,
  VillageQuest,
} from 'app/interfaces/models/game/quest';
import type { Building } from 'app/interfaces/models/game/building';
import type { Unit } from 'app/interfaces/models/game/unit';
import { units } from 'app/assets/units';
import type { PlayableTribe } from 'app/interfaces/models/game/tribe';
import { getUnitsByTribe } from 'app/assets/utils/units';

type VillageQuestDefinition = {
  id: VillageQuest['id'];
  scope: 'village';
};

type GlobalQuestDefinition = {
  id: GlobalQuest['id'];
  scope: 'global';
};

const createTroopCountQuest = (count: number): GlobalQuestDefinition => {
  return {
    id: `troopCount-${count}`,
    scope: 'global',
  };
};

const createTroopCountQuests = (): GlobalQuestDefinition[] => {
  const troopCounts = [
    10, 50, 100, 200, 500, 1000, 2000, 5000, 10_000, 20_000, 50_000, 100_000,
    150_000, 200_000, 300_000, 500_000, 750_000, 1_000_000,
  ];

  return troopCounts.flatMap((troopCount) => {
    return createTroopCountQuest(troopCount);
  });
};

const createAdventureCountQuest = (count: number): GlobalQuestDefinition => {
  return {
    id: `adventureCount-${count}`,
    scope: 'global',
  };
};

const createAdventureCountQuests = (): GlobalQuestDefinition[] => {
  const adventureCounts = [
    1, 3, 5, 10, 15, 20, 30, 50, 75, 100, 125, 150, 175, 200, 250, 300, 350,
    400, 450, 500,
  ];

  return adventureCounts.flatMap((adventureCount) => {
    return createAdventureCountQuest(adventureCount);
  });
};

const createKillCountQuest = (count: number): GlobalQuestDefinition => {
  return {
    id: `killCount-${count}`,
    scope: 'global',
  };
};

const createKillCountQuests = (): GlobalQuestDefinition[] => {
  const killCounts = [
    10, 50, 100, 200, 500, 1000, 2000, 5000, 10_000, 20_000, 50_000, 100_000,
    150_000, 200_000, 300_000, 500_000, 750_000, 1_000_000,
  ];

  return killCounts.flatMap((killCount) => {
    return createKillCountQuest(killCount);
  });
};

const createUnitKillCountQuest = (
  unitId: Unit['id'],
  count: number,
): GlobalQuestDefinition => {
  return {
    id: `unitKillCount-${unitId}-${count}`,
    scope: 'global',
  };
};

const createUnitKillCountQuests = (): GlobalQuestDefinition[] => {
  const killCounts = [
    10, 50, 100, 200, 500, 1000, 2000, 5000, 10_000, 20_000, 50_000, 100_000,
  ];

  return units
    .filter(
      ({ id }) =>
        id !== 'HERO' && !id.includes('SETTLER') && !id.includes('CHIEF'),
    )
    .flatMap(({ id }) => {
      return killCounts.flatMap((killCount) => {
        return createUnitKillCountQuest(id, killCount);
      });
    });
};

const createUnitTroopCountQuest = (
  unitId: Unit['id'],
  count: number,
): GlobalQuestDefinition => {
  return {
    id: `unitTroopCount-${unitId}-${count}`,
    scope: 'global',
  };
};

export const createUnitTroopCountQuests = (
  tribe: PlayableTribe,
): GlobalQuestDefinition[] => {
  const troopCounts = [
    10, 50, 100, 200, 500, 1000, 2000, 5000, 10_000, 20_000, 50_000, 100_000,
  ];

  const unitsByTribe = getUnitsByTribe(tribe);

  return unitsByTribe.flatMap(({ id }) => {
    return troopCounts.flatMap((troopCount) => {
      return createUnitTroopCountQuest(id, troopCount);
    });
  });
};

export const createBuildingQuest = (
  buildingId: Building['id'],
  level: number,
  matcher: 'oneOf' | 'every' = 'oneOf',
): VillageQuestDefinition => {
  return {
    id: `${matcher}-${buildingId}-${level}`,
    scope: 'village',
  };
};

export const globalQuests: GlobalQuestDefinition[] = [
  ...createAdventureCountQuests(),
  ...createTroopCountQuests(),
  ...createUnitKillCountQuests(),
  ...createKillCountQuests(),
];

export const villageQuests: VillageQuestDefinition[] = [
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
  createBuildingQuest('SMITHY', 1),
  createBuildingQuest('SMITHY', 5),
  createBuildingQuest('SMITHY', 10),
  createBuildingQuest('SMITHY', 15),
  createBuildingQuest('SMITHY', 20),
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
