/**
 * A couple of important things to keep in mind
 * building.effects:
 * - valuesPerLevel array length must always be building.maxLevel + 1. It needs to account for levels [0, ..., maxLevel]
 * - Each building must have a 'wheatProduction' effect at index 0. This is used for population count. First value must be 0 (lvl 0 building doesn't cost any wheat)
 */

import type {
  Building,
  BuildingEffect,
} from 'app/interfaces/models/game/building';
import type {
  Effect,
  ResourceProductionEffectId,
  TroopTrainingDurationEffectId,
} from 'app/interfaces/models/game/effect';

const createInfantryAndCavalryDefenceEffects = (
  type: Effect['type'],
  valuesPerLevel: number[],
): BuildingEffect[] => {
  return [
    {
      effectId: 'infantryDefence',
      valuesPerLevel,
      type,
    },
    {
      effectId: 'cavalryDefence',
      valuesPerLevel,
      type,
    },
  ];
};

// Different building have different crop consumption. There doesn't seem to be a pattern to it (this should probably be changed), so for now,
// they'll just be grouped together based on type.
const createNegativeWheatProductionEffect = (
  type: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' = 'A',
): BuildingEffect => {
  let valuesPerLevel: number[];

  switch (type) {
    case 'F': {
      valuesPerLevel = [
        0, 0, 0, 0, 0, 0, -1, -2, -3, -4, -5, -6, -7, -8, -9, -10, -12, -14,
        -16, -18, -20,
      ];
      break;
    }
    case 'E': {
      valuesPerLevel = [
        0, -5, -8, -11, -14, -17, -20, -23, -26, -29, -32, -36, -40, -44, -48,
        -52, -56, -60, -64, -68, -72,
      ];
      break;
    }
    case 'D': {
      valuesPerLevel = [
        0, -2, -3, -4, -5, -6, -8, -10, -12, -14, -16, -18, -20, -22, -24, -26,
        -29, -32, -35, -38, -41,
      ];
      break;
    }
    case 'C': {
      valuesPerLevel = [
        0, -3, -5, -7, -9, -11, -13, -15, -17, -19, -21, -24, -27, -30, -33,
        -36, -39, -42, -45, -48, -51,
      ];
      break;
    }
    case 'B': {
      valuesPerLevel = [
        0, -4, -6, -8, -10, -12, -15, -18, -21, -24, -27, -30, -33, -36, -39,
        -42, -46, -50, -54, -58, -62,
      ];
      break;
    }
    default: // 'A'
      valuesPerLevel = [
        0, -1, -2, -3, -4, -5, -6, -7, -8, -9, -10, -12, -14, -16, -18, -20,
        -22, -24, -26, -28, -30,
      ];
      break;
  }

  return {
    effectId: 'wheatProduction',
    valuesPerLevel,
    type: 'base',
  };
};

const createResourceProductionEffect = (
  effectId: ResourceProductionEffectId,
): BuildingEffect => {
  return {
    effectId,
    valuesPerLevel: [
      3, 7, 13, 21, 31, 46, 70, 98, 140, 203, 280, 392, 525, 693, 889, 1120,
      1400, 1820, 2240, 2800, 3430,
    ],
    type: 'base',
  };
};

const createResourceBoosterEffect = (
  effectId: ResourceProductionEffectId,
  limit = 6,
): BuildingEffect => {
  return {
    effectId,
    valuesPerLevel: [
      1, 1.05, 1.1, 1.15, 1.2, 1.25, 1.3, 1.35, 1.4, 1.45, 1.5, 1.55, 1.6, 1.65,
      1.7, 1.75, 1.8, 1.85, 1.9, 1.95, 2,
    ].slice(0, limit),
    type: 'bonus',
  };
};

const createOasisBonusBoosterEffect = (
  effectId: ResourceProductionEffectId,
): BuildingEffect => {
  return {
    effectId,
    valuesPerLevel: [
      1, 1.05, 1.1, 1.15, 1.2, 1.25, 1.3, 1.35, 1.4, 1.45, 1.5, 1.55, 1.6, 1.65,
      1.7, 1.75, 1.8, 1.85, 1.9, 1.95, 2,
    ],
    type: 'bonus-booster',
  };
};

const createResourceBoosterBuildingEffect = (
  effectId: ResourceProductionEffectId,
): BuildingEffect[] => {
  return [
    {
      effectId: 'wheatProduction',
      valuesPerLevel: [0, -4, -6, -8, -10, -12],
      type: 'base',
    },
    createResourceBoosterEffect(effectId),
  ];
};

const createTroopDurationEffect = (
  effectId: TroopTrainingDurationEffectId,
): BuildingEffect => {
  return {
    effectId,
    valuesPerLevel: [
      1, 1, 0.9091, 0.8333, 0.7143, 0.6667, 0.5882, 0.5263, 0.4762, 0.4348,
      0.3846, 0.3448, 0.3125, 0.2857, 0.2564, 0.2273, 0.2041, 0.1852, 0.1667,
      0.1493, 0.1351,
    ],
    type: 'bonus',
  };
};

const createStorageCapacityEffect = (
  effectId: 'warehouseCapacity' | 'granaryCapacity',
): BuildingEffect => {
  return {
    effectId,
    valuesPerLevel: [
      0, 400, 900, 1500, 2300, 3200, 4300, 5600, 7200, 9000, 11300, 13900,
      17200, 21000, 25600, 31000, 37700, 45500, 55000, 66300, 80000,
    ],
    type: 'base',
  };
};

const createLinearEffectValues = (
  effectId: 'merchantAmount' | 'revealedIncomingTroopsAmount',
): BuildingEffect => {
  return {
    effectId,
    valuesPerLevel: [...new Array(21).keys()],
    type: 'base',
  };
};

const createGovernmentBuildingDefenceEffects = (): BuildingEffect[] => {
  return createInfantryAndCavalryDefenceEffects(
    'base',
    [
      0, 2, 8, 18, 32, 50, 72, 98, 128, 162, 200, 242, 288, 338, 392, 450, 512,
      578, 648, 722, 800,
    ],
  );
};

const createHorseDrinkingTroughEffects = (): BuildingEffect[] => {
  const valuesPerLevel = [
    1, 1, 0.99, 0.98, 0.97, 0.96, 0.95, 0.94, 0.93, 0.92, 0.91, 0.9, 0.89, 0.88,
    0.86, 0.85, 0.84, 0.83, 0.82, 0.81, 0.8,
  ];
  return [
    {
      effectId: 'stableTrainingDuration',
      valuesPerLevel,
      type: 'bonus',
    },
    {
      effectId: 'greatStableTrainingDuration',
      valuesPerLevel,
      type: 'bonus',
    },
  ];
};

export const buildings: Building[] = [
  {
    id: 'BAKERY',
    category: 'resource-booster',
    effects: [...createResourceBoosterBuildingEffect('wheatProduction')],
    buildingRequirements: [
      {
        id: 1,
        type: 'amount',
        amount: 1,
      },
      {
        id: 2,
        type: 'building',
        buildingId: 'WHEAT_FIELD',
        level: 10,
      },
      {
        id: 3,
        type: 'building',
        buildingId: 'GRAIN_MILL',
        level: 5,
      },
      {
        id: 4,
        type: 'building',
        buildingId: 'MAIN_BUILDING',
        level: 5,
      },
    ],
    baseBuildingCost: [1200, 1480, 870, 1600],
    buildingCostCoefficient: 1.8,
    maxLevel: 5,
    buildingDurationBase: 1.5,
    buildingDurationModifier: 6080,
    buildingDurationReduction: 2400,
  },
  {
    id: 'BRICKYARD',
    category: 'resource-booster',
    effects: [...createResourceBoosterBuildingEffect('clayProduction')],
    buildingRequirements: [
      {
        id: 1,
        type: 'amount',
        amount: 1,
      },
      {
        id: 2,
        type: 'building',
        buildingId: 'CLAY_PIT',
        level: 10,
      },
      {
        id: 3,
        type: 'building',
        buildingId: 'MAIN_BUILDING',
        level: 5,
      },
    ],
    baseBuildingCost: [440, 480, 320, 50],
    buildingCostCoefficient: 1.8,
    maxLevel: 5,
    buildingDurationBase: 1.5,
    buildingDurationModifier: 5240,
    buildingDurationReduction: 2400,
  },
  {
    id: 'CLAY_PIT',
    category: 'resource-production',
    buildingRequirements: [],
    effects: [
      createNegativeWheatProductionEffect('D'),
      createResourceProductionEffect('clayProduction'),
    ],
    baseBuildingCost: [80, 40, 80, 50],
    buildingCostCoefficient: 1.67,
    maxLevel: 20,
    buildingDurationBase: 1.6,
    buildingDurationModifier: 553,
    buildingDurationReduction: 333,
  },
  {
    id: 'WHEAT_FIELD',
    category: 'resource-production',
    buildingRequirements: [],
    effects: [
      createNegativeWheatProductionEffect('F'),
      createResourceProductionEffect('wheatProduction'),
    ],
    baseBuildingCost: [70, 90, 70, 20],
    buildingCostCoefficient: 1.67,
    maxLevel: 20,
    buildingDurationBase: 1.6,
    buildingDurationModifier: 483,
    buildingDurationReduction: 333,
  },
  {
    id: 'GRAIN_MILL',
    category: 'resource-booster',
    effects: [...createResourceBoosterBuildingEffect('wheatProduction')],
    buildingRequirements: [
      {
        id: 1,
        type: 'amount',
        amount: 1,
      },
      {
        id: 2,
        type: 'building',
        buildingId: 'WHEAT_FIELD',
        level: 5,
      },
    ],
    baseBuildingCost: [500, 440, 380, 1240],
    buildingCostCoefficient: 1.8,
    maxLevel: 5,
    buildingDurationBase: 1.5,
    buildingDurationModifier: 4240,
    buildingDurationReduction: 2400,
  },
  {
    id: 'GRANARY',
    category: 'infrastructure',
    effects: [
      createNegativeWheatProductionEffect('A'),
      createStorageCapacityEffect('granaryCapacity'),
    ],
    buildingRequirements: [
      {
        id: 1,
        type: 'amount',
        amount: Number.POSITIVE_INFINITY,
      },
      {
        id: 2,
        type: 'building',
        buildingId: 'MAIN_BUILDING',
        level: 1,
      },
    ],
    baseBuildingCost: [80, 100, 70, 20],
    buildingCostCoefficient: 1.28,
    maxLevel: 20,
    buildingDurationBase: 1.16,
    buildingDurationModifier: 3475,
    buildingDurationReduction: 1875,
  },
  {
    id: 'IRON_FOUNDRY',
    category: 'resource-booster',
    effects: [...createResourceBoosterBuildingEffect('ironProduction')],
    buildingRequirements: [
      {
        id: 1,
        type: 'amount',
        amount: 1,
      },
      {
        id: 2,
        type: 'building',
        buildingId: 'IRON_MINE',
        level: 10,
      },
      {
        id: 3,
        type: 'building',
        buildingId: 'MAIN_BUILDING',
        level: 5,
      },
    ],
    baseBuildingCost: [200, 450, 510, 120],
    buildingCostCoefficient: 1.8,
    maxLevel: 5,
    buildingDurationBase: 1.5,
    buildingDurationModifier: 6480,
    buildingDurationReduction: 2400,
  },
  {
    id: 'IRON_MINE',
    category: 'resource-production',
    buildingRequirements: [],
    effects: [
      createNegativeWheatProductionEffect('C'),
      createResourceProductionEffect('ironProduction'),
    ],
    baseBuildingCost: [100, 80, 30, 60],
    buildingCostCoefficient: 1.67,
    maxLevel: 20,
    buildingDurationBase: 1.6,
    buildingDurationModifier: 783,
    buildingDurationReduction: 333,
  },
  {
    id: 'SAWMILL',
    category: 'resource-booster',
    effects: [...createResourceBoosterBuildingEffect('woodProduction')],
    buildingRequirements: [
      {
        id: 1,
        type: 'amount',
        amount: 1,
      },
      {
        id: 2,
        type: 'building',
        buildingId: 'WOODCUTTER',
        level: 10,
      },
      {
        id: 3,
        type: 'building',
        buildingId: 'MAIN_BUILDING',
        level: 5,
      },
    ],
    baseBuildingCost: [520, 380, 290, 90],
    buildingCostCoefficient: 1.8,
    maxLevel: 5,
    buildingDurationBase: 1.5,
    buildingDurationModifier: 5400,
    buildingDurationReduction: 2400,
  },
  {
    id: 'WAREHOUSE',
    category: 'infrastructure',
    effects: [
      createNegativeWheatProductionEffect('A'),
      createStorageCapacityEffect('warehouseCapacity'),
    ],
    buildingRequirements: [
      {
        id: 1,
        type: 'amount',
        amount: Number.POSITIVE_INFINITY,
      },
      {
        id: 2,
        type: 'building',
        buildingId: 'MAIN_BUILDING',
        level: 1,
      },
    ],
    baseBuildingCost: [130, 160, 90, 40],
    buildingCostCoefficient: 1.28,
    maxLevel: 20,
    buildingDurationBase: 1.16,
    buildingDurationModifier: 3875,
    buildingDurationReduction: 1875,
  },
  {
    id: 'WATERWORKS',
    category: 'infrastructure',
    effects: [
      createNegativeWheatProductionEffect('A'),
      createOasisBonusBoosterEffect('woodProduction'),
      createOasisBonusBoosterEffect('clayProduction'),
      createOasisBonusBoosterEffect('ironProduction'),
      createOasisBonusBoosterEffect('wheatProduction'),
    ],
    buildingRequirements: [
      {
        id: 1,
        type: 'amount',
        amount: 1,
      },
      {
        id: 2,
        type: 'building',
        buildingId: 'HEROS_MANSION',
        level: 10,
      },
      {
        id: 3,
        type: 'tribe',
        tribe: 'egyptians',
      },
    ],
    baseBuildingCost: [910, 945, 910, 340],
    buildingCostCoefficient: 1.31,
    maxLevel: 20,
    buildingDurationBase: 1.16,
    buildingDurationModifier: 3875,
    buildingDurationReduction: 1875,
  },
  {
    id: 'WOODCUTTER',
    category: 'resource-production',
    buildingRequirements: [],
    effects: [
      createNegativeWheatProductionEffect('D'),
      createResourceProductionEffect('woodProduction'),
    ],
    baseBuildingCost: [40, 100, 50, 60],
    buildingCostCoefficient: 1.67,
    maxLevel: 20,
    buildingDurationBase: 1.6,
    buildingDurationModifier: 593,
    buildingDurationReduction: 333,
  },
  {
    id: 'ACADEMY',
    category: 'military',
    effects: [createNegativeWheatProductionEffect('B')],
    buildingRequirements: [
      {
        id: 1,
        type: 'amount',
        amount: 1,
      },
      {
        id: 2,
        type: 'building',
        buildingId: 'MAIN_BUILDING',
        level: 3,
      },
      {
        id: 3,
        type: 'building',
        buildingId: 'BARRACKS',
        level: 3,
      },
    ],
    baseBuildingCost: [220, 160, 90, 40],
    buildingCostCoefficient: 1.28,
    maxLevel: 20,
    buildingDurationBase: 1.16,
    buildingDurationModifier: 3875,
    buildingDurationReduction: 1875,
  },
  {
    id: 'BARRACKS',
    category: 'military',
    effects: [
      createNegativeWheatProductionEffect('B'),
      createTroopDurationEffect('barracksTrainingDuration'),
    ],
    buildingRequirements: [
      {
        id: 1,
        type: 'amount',
        amount: 1,
      },
      {
        id: 2,
        type: 'building',
        buildingId: 'MAIN_BUILDING',
        level: 3,
      },
      {
        id: 3,
        type: 'building',
        buildingId: 'RALLY_POINT',
        level: 1,
      },
    ],
    baseBuildingCost: [210, 140, 260, 120],
    buildingCostCoefficient: 1.28,
    maxLevel: 20,
    buildingDurationBase: 1.16,
    buildingDurationModifier: 3875,
    buildingDurationReduction: 1875,
  },
  {
    id: 'CITY_WALL',
    category: 'military',
    effects: [
      createNegativeWheatProductionEffect('F'),
      ...createInfantryAndCavalryDefenceEffects(
        'bonus',
        [
          1, 1.03, 1.06, 1.09, 1.13, 1.16, 1.19, 1.23, 1.27, 1.31, 1.34, 1.38,
          1.43, 1.47, 1.51, 1.56, 1.6, 1.65, 1.7, 1.75, 1.81,
        ],
      ),
      ...createInfantryAndCavalryDefenceEffects(
        'base',
        [
          0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150,
          160, 170, 180, 190, 200,
        ],
      ),
    ],
    buildingRequirements: [
      {
        id: 1,
        type: 'amount',
        amount: 1,
      },
      {
        id: 2,
        type: 'tribe',
        tribe: 'romans',
      },
    ],
    baseBuildingCost: [70, 90, 170, 70],
    buildingCostCoefficient: 1.28,
    maxLevel: 20,
    buildingDurationBase: 1.16,
    buildingDurationModifier: 3875,
    buildingDurationReduction: 1875,
  },
  {
    id: 'EARTH_WALL',
    category: 'military',
    effects: [
      createNegativeWheatProductionEffect('F'),
      ...createInfantryAndCavalryDefenceEffects(
        'bonus',
        [
          1, 1.02, 1.04, 1.06, 1.08, 1.1, 1.13, 1.15, 1.17, 1.2, 1.22, 1.24,
          1.27, 1.29, 1.32, 1.35, 1.37, 1.4, 1.43, 1.46, 1.49,
        ],
      ),
      ...createInfantryAndCavalryDefenceEffects(
        'base',
        [
          0, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72, 78, 84, 90, 96, 102,
          108, 114, 120,
        ],
      ),
    ],
    buildingRequirements: [
      {
        id: 1,
        type: 'amount',
        amount: 1,
      },
      {
        id: 2,
        type: 'tribe',
        tribe: 'teutons',
      },
    ],
    baseBuildingCost: [120, 200, 0, 80],
    buildingCostCoefficient: 1.28,
    maxLevel: 20,
    buildingDurationBase: 1.16,
    buildingDurationModifier: 3875,
    buildingDurationReduction: 1875,
  },
  {
    id: 'GREAT_BARRACKS',
    category: 'military',
    effects: [
      createNegativeWheatProductionEffect('B'),
      createTroopDurationEffect('greatBarracksTrainingDuration'),
    ],
    buildingRequirements: [
      {
        id: 1,
        type: 'amount',
        amount: 1,
      },
      {
        id: 2,
        type: 'building',
        buildingId: 'BARRACKS',
        level: 20,
      },
    ],
    baseBuildingCost: [630, 420, 780, 360],
    buildingCostCoefficient: 1.28,
    maxLevel: 20,
    buildingDurationBase: 1.16,
    buildingDurationModifier: 3875,
    buildingDurationReduction: 1875,
  },
  {
    id: 'GREAT_STABLE',
    category: 'military',
    effects: [
      createNegativeWheatProductionEffect('E'),
      createTroopDurationEffect('greatStableTrainingDuration'),
    ],
    buildingRequirements: [
      {
        id: 1,
        type: 'amount',
        amount: 1,
      },
      {
        id: 2,
        type: 'building',
        buildingId: 'STABLE',
        level: 20,
      },
    ],
    baseBuildingCost: [780, 420, 660, 300],
    buildingCostCoefficient: 1.28,
    maxLevel: 20,
    buildingDurationBase: 1.16,
    buildingDurationModifier: 4075,
    buildingDurationReduction: 1875,
  },
  {
    id: 'HEROS_MANSION',
    category: 'military',
    effects: [createNegativeWheatProductionEffect('D')],
    buildingRequirements: [
      {
        id: 1,
        type: 'amount',
        amount: 1,
      },
      {
        id: 2,
        type: 'building',
        buildingId: 'MAIN_BUILDING',
        level: 3,
      },
      {
        id: 3,
        type: 'building',
        buildingId: 'RALLY_POINT',
        level: 1,
      },
    ],
    baseBuildingCost: [700, 670, 700, 240],
    buildingCostCoefficient: 1.33,
    maxLevel: 20,
    buildingDurationBase: 1.16,
    buildingDurationModifier: 2300,
    buildingDurationReduction: 0,
  },
  {
    id: 'HOSPITAL',
    category: 'military',
    effects: [
      createNegativeWheatProductionEffect('C'),
      createTroopDurationEffect('hospitalTrainingDuration'),
    ],
    buildingRequirements: [
      {
        id: 1,
        type: 'amount',
        amount: 1,
      },
      {
        id: 2,
        type: 'building',
        buildingId: 'MAIN_BUILDING',
        level: 10,
      },
      {
        id: 3,
        type: 'building',
        buildingId: 'ACADEMY',
        level: 15,
      },
    ],
    baseBuildingCost: [320, 280, 420, 360],
    buildingCostCoefficient: 1.28,
    maxLevel: 20,
    buildingDurationBase: 1.16,
    buildingDurationModifier: 4875,
    buildingDurationReduction: 1875,
  },
  {
    id: 'MAKESHIFT_WALL',
    category: 'military',
    effects: [
      createNegativeWheatProductionEffect('F'),
      ...createInfantryAndCavalryDefenceEffects(
        'bonus',
        [
          1, 1.02, 1.03, 1.05, 1.06, 1.08, 1.09, 1.11, 1.13, 1.14, 1.16, 1.18,
          1.2, 1.21, 1.23, 1.25, 1.27, 1.29, 1.31, 1.33, 1.35,
        ],
      ),
      ...createInfantryAndCavalryDefenceEffects(
        'base',
        [
          0, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72, 78, 84, 90, 96, 102,
          108, 114, 120,
        ],
      ),
    ],
    buildingRequirements: [
      {
        id: 1,
        type: 'amount',
        amount: 1,
      },
      {
        id: 2,
        type: 'tribe',
        tribe: 'huns',
      },
    ],
    baseBuildingCost: [50, 80, 40, 30],
    buildingCostCoefficient: 1.28,
    maxLevel: 20,
    buildingDurationBase: 1.16,
    buildingDurationModifier: 3875,
    buildingDurationReduction: 1875,
  },
  {
    id: 'PALISADE',
    category: 'military',
    effects: [
      createNegativeWheatProductionEffect('F'),
      ...createInfantryAndCavalryDefenceEffects(
        'bonus',
        [
          1, 1.03, 1.05, 1.08, 1.1, 1.13, 1.16, 1.19, 1.22, 1.25, 1.28, 1.31,
          1.35, 1.38, 1.41, 1.45, 1.49, 1.52, 1.56, 1.6, 1.64,
        ],
      ),
      ...createInfantryAndCavalryDefenceEffects(
        'base',
        [
          0, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 104, 112, 120, 128,
          136, 144, 152, 160,
        ],
      ),
    ],
    buildingRequirements: [
      {
        id: 1,
        type: 'amount',
        amount: 1,
      },
      {
        id: 2,
        type: 'tribe',
        tribe: 'gauls',
      },
    ],
    baseBuildingCost: [160, 100, 80, 60],
    buildingCostCoefficient: 1.28,
    maxLevel: 20,
    buildingDurationBase: 1.16,
    buildingDurationModifier: 3875,
    buildingDurationReduction: 1875,
  },
  {
    id: 'RALLY_POINT',
    category: 'military',
    effects: [
      createNegativeWheatProductionEffect('A'),
      createLinearEffectValues('revealedIncomingTroopsAmount'),
    ],
    buildingRequirements: [
      {
        id: 1,
        type: 'amount',
        amount: 1,
      },
    ],
    baseBuildingCost: [110, 160, 90, 70],
    buildingCostCoefficient: 1.28,
    maxLevel: 20,
    buildingDurationBase: 1.16,
    buildingDurationModifier: 3875,
    buildingDurationReduction: 1875,
  },
  {
    id: 'STABLE',
    category: 'military',
    effects: [
      createNegativeWheatProductionEffect('E'),
      createTroopDurationEffect('stableTrainingDuration'),
    ],
    buildingRequirements: [
      {
        id: 1,
        type: 'amount',
        amount: 1,
      },
      {
        id: 2,
        type: 'building',
        buildingId: 'ACADEMY',
        level: 5,
      },
      {
        id: 3,
        type: 'building',
        buildingId: 'SMITHY',
        level: 3,
      },
    ],
    baseBuildingCost: [260, 140, 220, 100],
    buildingCostCoefficient: 1.28,
    maxLevel: 20,
    buildingDurationBase: 1.16,
    buildingDurationModifier: 4075,
    buildingDurationReduction: 1875,
  },
  {
    id: 'SMITHY',
    category: 'military',
    effects: [createNegativeWheatProductionEffect('B')],
    buildingRequirements: [
      {
        id: 1,
        type: 'amount',
        amount: 1,
      },
      {
        id: 2,
        type: 'building',
        buildingId: 'ACADEMY',
        level: 1,
      },
      {
        id: 3,
        type: 'building',
        buildingId: 'MAIN_BUILDING',
        level: 3,
      },
    ],
    baseBuildingCost: [180, 250, 500, 160],
    buildingCostCoefficient: 1.28,
    maxLevel: 20,
    buildingDurationBase: 1.16,
    buildingDurationModifier: 2875,
    buildingDurationReduction: 1875,
  },
  {
    id: 'STONE_WALL',
    category: 'military',
    effects: [
      createNegativeWheatProductionEffect('F'),
      ...createInfantryAndCavalryDefenceEffects(
        'bonus',
        [
          1, 1.03, 1.05, 1.08, 1.1, 1.13, 1.16, 1.19, 1.22, 1.25, 1.28, 1.31,
          1.35, 1.38, 1.41, 1.45, 1.49, 1.52, 1.56, 1.6, 1.64,
        ],
      ),
      ...createInfantryAndCavalryDefenceEffects(
        'base',
        [
          0, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 104, 112, 120, 128,
          136, 144, 152, 160,
        ],
      ),
    ],
    buildingRequirements: [
      {
        id: 1,
        type: 'amount',
        amount: 1,
      },
      {
        id: 2,
        type: 'tribe',
        tribe: 'egyptians',
      },
    ],
    baseBuildingCost: [110, 160, 70, 60],
    buildingCostCoefficient: 1.28,
    maxLevel: 20,
    buildingDurationBase: 1.16,
    buildingDurationModifier: 3875,
    buildingDurationReduction: 1875,
  },
  {
    id: 'TRAPPER',
    category: 'military',
    effects: [
      createNegativeWheatProductionEffect('B'),
      {
        effectId: 'trapperCapacity',
        valuesPerLevel: [
          0, 10, 22, 35, 49, 64, 80, 97, 115, 134, 154, 175, 196, 218, 241, 265,
          290, 316, 343, 371, 400,
        ],
        type: 'base',
      },
    ],
    buildingRequirements: [
      {
        id: 1,
        type: 'amount',
        amount: 1,
      },
      {
        id: 2,
        type: 'building',
        buildingId: 'RALLY_POINT',
        level: 1,
      },
      {
        id: 3,
        type: 'tribe',
        tribe: 'gauls',
      },
    ],
    baseBuildingCost: [80, 120, 70, 90],
    buildingCostCoefficient: 1.28,
    maxLevel: 20,
    buildingDurationBase: 1.16,
    buildingDurationModifier: 2000,
    buildingDurationReduction: 0,
  },
  {
    id: 'WORKSHOP',
    category: 'military',
    effects: [
      createNegativeWheatProductionEffect('C'),
      createTroopDurationEffect('workshopTrainingDuration'),
    ],
    buildingRequirements: [
      {
        id: 1,
        type: 'amount',
        amount: 1,
      },
      {
        id: 2,
        type: 'building',
        buildingId: 'MAIN_BUILDING',
        level: 5,
      },
      {
        id: 3,
        type: 'building',
        buildingId: 'ACADEMY',
        level: 10,
      },
    ],
    baseBuildingCost: [460, 510, 600, 320],
    buildingCostCoefficient: 1.28,
    maxLevel: 20,
    buildingDurationBase: 1.16,
    buildingDurationModifier: 4875,
    buildingDurationReduction: 1875,
  },
  {
    id: 'BREWERY',
    category: 'infrastructure',
    effects: [
      {
        effectId: 'wheatProduction',
        valuesPerLevel: [
          0, -6, -3, -3, -3, -3, -4, -4, -4, -4, -4, -4, -4, -4, -4, -4, -5, -5,
          -5, -5, -5,
        ],
        type: 'base',
      },
      {
        effectId: 'attack',
        valuesPerLevel: [
          1, 1.01, 1.02, 1.03, 1.04, 1.05, 1.06, 1.07, 1.08, 1.09, 1.1, 1.11,
          1.12, 1.13, 1.14, 1.15, 1.16, 1.17, 1.18, 1.19, 1.2,
        ],
        type: 'bonus',
      },
    ],
    buildingRequirements: [
      {
        id: 1,
        type: 'amount',
        amount: 1,
      },
      {
        id: 2,
        type: 'building',
        buildingId: 'GRANARY',
        level: 20,
      },
      {
        id: 3,
        type: 'building',
        buildingId: 'RALLY_POINT',
        level: 10,
      },
      {
        id: 4,
        type: 'tribe',
        tribe: 'teutons',
      },
    ],
    baseBuildingCost: [3210, 2050, 2750, 3830],
    buildingCostCoefficient: 1.4,
    maxLevel: 20,
    buildingDurationBase: 1.16,
    buildingDurationModifier: 11750,
    buildingDurationReduction: 3750,
  },
  {
    id: 'COMMAND_CENTER',
    category: 'infrastructure',
    effects: [
      createNegativeWheatProductionEffect('A'),
      ...createGovernmentBuildingDefenceEffects(),
    ],
    buildingRequirements: [
      {
        id: 1,
        type: 'amount',
        amount: 1,
      },
      {
        id: 2,
        type: 'building',
        buildingId: 'MAIN_BUILDING',
        level: 5,
      },
      {
        id: 3,
        type: 'tribe',
        tribe: 'huns',
      },
    ],
    baseBuildingCost: [1600, 1250, 1050, 200],
    buildingCostCoefficient: 1.22,
    maxLevel: 20,
    buildingDurationBase: 1.16,
    buildingDurationModifier: 3875,
    buildingDurationReduction: 1875,
  },
  {
    id: 'CRANNY',
    category: 'infrastructure',
    effects: [
      {
        effectId: 'wheatProduction',
        valuesPerLevel: [0, 0, 0, 0, 0, 0, -1, -1, -1, -1, -1],
        type: 'base',
      },
      {
        effectId: 'crannyCapacity',
        valuesPerLevel: [0, 100, 130, 170, 220, 280, 360, 460, 600, 770, 1000],
        type: 'base',
      },
    ],
    buildingRequirements: [
      {
        id: 1,
        type: 'amount',
        amount: Number.POSITIVE_INFINITY,
      },
    ],
    baseBuildingCost: [40, 50, 30, 10],
    buildingCostCoefficient: 1.28,
    maxLevel: 10,
    buildingDurationBase: 1.16,
    buildingDurationModifier: 2625,
    buildingDurationReduction: 1875,
  },
  {
    id: 'HORSE_DRINKING_TROUGH',
    category: 'infrastructure',
    effects: [
      createNegativeWheatProductionEffect('E'),
      ...createHorseDrinkingTroughEffects(),
    ],
    buildingRequirements: [
      {
        id: 1,
        type: 'amount',
        amount: 1,
      },
      {
        id: 2,
        type: 'building',
        buildingId: 'RALLY_POINT',
        level: 10,
      },
      {
        id: 3,
        type: 'building',
        buildingId: 'STABLE',
        level: 20,
      },
      {
        id: 4,
        type: 'tribe',
        tribe: 'romans',
      },
    ],
    baseBuildingCost: [780, 420, 660, 540],
    buildingCostCoefficient: 1.28,
    maxLevel: 20,
    buildingDurationBase: 1.16,
    buildingDurationModifier: 5950,
    buildingDurationReduction: 3750,
  },
  {
    id: 'MAIN_BUILDING',
    category: 'infrastructure',
    effects: [
      createNegativeWheatProductionEffect('D'),
      {
        effectId: 'buildingDuration',
        valuesPerLevel: [
          1, 1, 0.98, 0.96, 0.94, 0.91, 0.89, 0.87, 0.85, 0.83, 0.81, 0.78,
          0.75, 0.73, 0.7, 0.67, 0.64, 0.6, 0.57, 0.54, 0.5,
        ],
        type: 'bonus',
      },
    ],
    buildingRequirements: [
      {
        id: 1,
        type: 'amount',
        amount: 1,
      },
    ],
    baseBuildingCost: [70, 40, 60, 20],
    buildingCostCoefficient: 1.28,
    maxLevel: 20,
    buildingDurationBase: 1.16,
    buildingDurationModifier: 3875,
    buildingDurationReduction: 1875,
  },
  {
    id: 'MARKETPLACE',
    category: 'infrastructure',
    effects: [
      createNegativeWheatProductionEffect('B'),
      createLinearEffectValues('merchantAmount'),
    ],
    buildingRequirements: [
      {
        id: 1,
        type: 'amount',
        amount: 1,
      },
      {
        id: 2,
        type: 'building',
        buildingId: 'WAREHOUSE',
        level: 1,
      },
      {
        id: 3,
        type: 'building',
        buildingId: 'GRANARY',
        level: 1,
      },
      {
        id: 4,
        type: 'building',
        buildingId: 'MAIN_BUILDING',
        level: 3,
      },
    ],
    baseBuildingCost: [80, 70, 120, 70],
    buildingCostCoefficient: 1.28,
    maxLevel: 20,
    buildingDurationBase: 1.16,
    buildingDurationModifier: 3675,
    buildingDurationReduction: 1875,
  },
  {
    id: 'RESIDENCE',
    category: 'infrastructure',
    effects: [
      createNegativeWheatProductionEffect('A'),
      ...createGovernmentBuildingDefenceEffects(),
    ],
    buildingRequirements: [
      {
        id: 1,
        type: 'amount',
        amount: 1,
      },
      {
        id: 2,
        type: 'building',
        buildingId: 'MAIN_BUILDING',
        level: 5,
      },
    ],
    baseBuildingCost: [580, 460, 350, 180],
    buildingCostCoefficient: 1.28,
    maxLevel: 20,
    buildingDurationBase: 1.16,
    buildingDurationModifier: 3875,
    buildingDurationReduction: 1875,
  },
  {
    id: 'TREASURY',
    category: 'infrastructure',
    effects: [createNegativeWheatProductionEffect('B')],
    buildingRequirements: [
      {
        id: 1,
        type: 'amount',
        amount: 1,
      },
      {
        id: 2,
        type: 'building',
        buildingId: 'MAIN_BUILDING',
        level: 10,
      },
    ],
    baseBuildingCost: [2880, 2740, 2580, 990],
    buildingCostCoefficient: 1.26,
    maxLevel: 20,
    buildingDurationBase: 1.16,
    buildingDurationModifier: 9875,
    buildingDurationReduction: 1875,
  },
  {
    id: 'TOURNAMENT_SQUARE',
    category: 'military',
    effects: [
      createNegativeWheatProductionEffect('A'),
      {
        effectId: 'unitSpeedAfter20Fields',
        valuesPerLevel: [
          1, 1.2, 1.4, 1.6, 1.8, 2, 2.2, 2.4, 2.6, 2.8, 3, 3.2, 3.4, 3.6, 3.8,
          4, 4.2, 4.4, 4.6, 4.8, 5,
        ],
        type: 'bonus',
      },
    ],
    buildingRequirements: [
      {
        id: 1,
        type: 'amount',
        amount: 1,
      },
      {
        id: 2,
        type: 'building',
        buildingId: 'RALLY_POINT',
        level: 15,
      },
    ],
    baseBuildingCost: [1750, 2250, 1530, 240],
    buildingCostCoefficient: 1.28,
    maxLevel: 20,
    buildingDurationBase: 1.16,
    buildingDurationModifier: 5375,
    buildingDurationReduction: 1875,
  },
  {
    id: 'TRADE_OFFICE',
    category: 'infrastructure',
    effects: [
      createNegativeWheatProductionEffect('C'),
      {
        effectId: 'merchantCapacity',
        valuesPerLevel: [
          1, 1.2, 1.4, 1.6, 1.8, 2, 2.2, 2.4, 2.6, 2.8, 3, 3.2, 3.4, 3.6, 3.8,
          4, 4.2, 4.4, 4.6, 4.8, 5,
        ],
        type: 'bonus',
      },
    ],
    buildingRequirements: [
      {
        id: 1,
        type: 'amount',
        amount: 1,
      },
      {
        id: 2,
        type: 'building',
        buildingId: 'MARKETPLACE',
        level: 20,
      },
      {
        id: 3,
        type: 'building',
        buildingId: 'STABLE',
        level: 10,
      },
    ],
    baseBuildingCost: [1400, 1330, 1200, 400],
    buildingCostCoefficient: 1.28,
    maxLevel: 20,
    buildingDurationBase: 1.16,
    buildingDurationModifier: 4875,
    buildingDurationReduction: 1875,
  },
  {
    id: 'EMBASSY',
    category: 'infrastructure',
    effects: [createNegativeWheatProductionEffect('C')],
    buildingRequirements: [
      {
        id: 1,
        type: 'amount',
        amount: 1,
      },
      {
        id: 2,
        type: 'building',
        buildingId: 'MAIN_BUILDING',
        level: 1,
      },
    ],
    baseBuildingCost: [1400, 1330, 1200, 400],
    buildingCostCoefficient: 1.28,
    maxLevel: 20,
    buildingDurationBase: 1.16,
    buildingDurationModifier: 3875,
    buildingDurationReduction: 1875,
  },
  {
    id: 'TOWN_HALL',
    category: 'infrastructure',
    effects: [createNegativeWheatProductionEffect('B')],
    buildingRequirements: [
      {
        id: 1,
        type: 'amount',
        amount: 1,
      },
      {
        id: 2,
        type: 'building',
        buildingId: 'MAIN_BUILDING',
        level: 10,
      },
      {
        id: 3,
        type: 'building',
        buildingId: 'ACADEMY',
        level: 10,
      },
    ],
    baseBuildingCost: [1250, 1110, 1260, 600],
    buildingCostCoefficient: 1.28,
    maxLevel: 20,
    buildingDurationBase: 1.16,
    buildingDurationModifier: 14375,
    buildingDurationReduction: 1875,
  },
];

// Use this for faster lookups
export const buildingMap = new Map<Building['id'], Building>(
  buildings.map((building) => [building.id, building]),
);
