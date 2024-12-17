import type { Building } from 'app/interfaces/models/game/building';

export const buildings: Building[] = [
  {
    id: 'BAKERY',
    category: 'resource-booster',
    buildingDuration: [3680000, 6720000, 11280000, 18120000, 28380000],
    cropConsumption: [4, 2, 2, 2, 2],
    effects: [
      {
        effectId: 'wheatProductionBonus',
        valuesPerLevel: [1, 1.05, 1.1, 1.15, 1.2, 1.25],
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
        buildingId: 'CROPLAND',
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
  },
  {
    id: 'BRICKYARD',
    category: 'resource-booster',
    buildingDuration: [2840000, 5460000, 9390000, 15290000, 24130000],
    cropConsumption: [3, 2, 2, 2, 2],
    effects: [
      {
        effectId: 'clayProductionBonus',
        valuesPerLevel: [1, 1.05, 1.1, 1.15, 1.2, 1.25],
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
  },
  {
    id: 'CLAY_PIT',
    category: 'resource-production',
    buildingDuration: [
      220000, 550000, 1080000, 1930000, 3290000, 5470000, 8950000, 14520000, 23430000, 37690000, 60510000, 97010000, 155420000, 248870000,
      398390000, 637620000, 1020390000, 1632820000, 2612710000, 4180540000, 6689060000, 10702690000,
    ],
    cropConsumption: [2, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3],
    buildingRequirements: [],
    effects: [
      {
        effectId: 'clayProduction',
        valuesPerLevel: [3, 7, 13, 21, 31, 46, 70, 98, 140, 203, 280, 392, 525, 693, 889, 1120, 1400, 1820, 2240, 2800, 3430],
      },
    ],
    baseBuildingCost: [80, 40, 80, 50],
    buildingCostCoefficient: 1.67,
    maxLevel: 22,
  },
  {
    id: 'CROPLAND',
    category: 'resource-production',
    buildingDuration: [
      150000, 440000, 900000, 1650000, 2830000, 4730000, 7780000, 12640000, 20430000, 32880000, 52810000, 84700000, 135710000, 217340000,
      347950000, 556910000, 891260000, 1426210000, 2282140000, 3651630000, 5842810000, 9348690000,
    ],
    cropConsumption: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2],
    buildingRequirements: [],
    effects: [
      {
        effectId: 'wheatProduction',
        valuesPerLevel: [3, 7, 13, 21, 31, 46, 70, 98, 140, 203, 280, 392, 525, 693, 889, 1120, 1400, 1820, 2240, 2800, 3430],
      },
    ],
    baseBuildingCost: [70, 90, 70, 20],
    buildingCostCoefficient: 1.67,
    maxLevel: 22,
  },
  {
    id: 'GRAIN_MILL',
    category: 'resource-booster',
    buildingDuration: [1840000, 3960000, 7140000, 11910000, 19070000],
    cropConsumption: [3, 2, 2, 2, 2],
    effects: [
      {
        effectId: 'wheatProductionBonus',
        valuesPerLevel: [1, 1.05, 1.1, 1.15, 1.2, 1.25],
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
        buildingId: 'CROPLAND',
        level: 5,
      },
    ],
    baseBuildingCost: [500, 440, 380, 1240],
    buildingCostCoefficient: 1.8,
    maxLevel: 5,
  },
  {
    id: 'GRANARY',
    category: 'infrastructure',
    buildingDuration: [
      1600000, 2160000, 2800000, 3550000, 4420000, 5420000, 6590000, 7950000, 9520000, 11340000, 13450000, 15910000, 18750000, 22050000,
      25880000, 30320000, 35470000, 41450000, 48380000, 56420000,
    ],
    cropConsumption: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    effects: [
      {
        effectId: 'granaryCapacity',
        valuesPerLevel: [
          0, 400, 900, 1500, 2300, 3200, 4200, 5500, 7000, 8800, 11000, 13600, 16800, 20600, 25100, 30500, 37100, 44900, 54300, 65600,
          79200,
        ],
      },
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
  },
  {
    id: 'IRON_FOUNDRY',
    category: 'resource-booster',
    buildingDuration: [4080000, 7320000, 12180000, 19470000, 30410000],
    cropConsumption: [6, 3, 3, 3, 3],
    effects: [
      {
        effectId: 'ironProductionBonus',
        valuesPerLevel: [1, 1.05, 1.1, 1.15, 1.2, 1.25],
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
  },
  {
    id: 'IRON_MINE',
    category: 'resource-production',
    buildingDuration: [
      450000, 920000, 1670000, 2880000, 4800000, 7880000, 12810000, 20690000, 33310000, 53500000, 85800000, 137470000, 220160000, 352450000,
      564120000, 902790000, 1444660000, 2311660000, 3698850000, 5918370000, 9469590000, 15151540000,
    ],
    cropConsumption: [3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4],
    buildingRequirements: [],
    effects: [
      {
        effectId: 'ironProduction',
        valuesPerLevel: [3, 7, 13, 21, 31, 46, 70, 98, 140, 203, 280, 392, 525, 693, 889, 1120, 1400, 1820, 2240, 2800, 3430],
      },
    ],
    baseBuildingCost: [100, 80, 30, 60],
    buildingCostCoefficient: 1.67,
    maxLevel: 22,
  },
  {
    id: 'SAWMILL',
    category: 'resource-booster',
    buildingDuration: [3000000, 5700000, 9750000, 15830000, 24940000],
    cropConsumption: [4, 2, 2, 2, 2],
    effects: [
      {
        effectId: 'woodProductionBonus',
        valuesPerLevel: [1, 1.05, 1.1, 1.15, 1.2, 1.25],
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
  },
  {
    id: 'WAREHOUSE',
    category: 'infrastructure',
    buildingDuration: [
      2000000, 2620000, 3340000, 4170000, 5140000, 6260000, 7570000, 9080000, 10830000, 12860000, 15220000, 17950000, 21130000, 24810000,
      29080000, 34030000, 39770000, 46440000, 54170000, 63130000,
    ],
    cropConsumption: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    effects: [
      {
        effectId: 'warehouseCapacity',
        valuesPerLevel: [
          0, 400, 900, 1500, 2300, 3200, 4200, 5500, 7000, 8800, 11000, 13600, 16800, 20600, 25100, 30500, 37100, 44900, 54300, 65600,
          79200,
        ],
      },
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
  },
  {
    id: 'WATERWORKS',
    category: 'infrastructure',
    buildingDuration: [
      2000000, 2620000, 3340000, 4170000, 5140000, 6260000, 7570000, 9080000, 10830000, 12860000, 15220000, 17950000, 21130000, 24810000,
      29080000, 34030000, 39770000, 46440000, 54170000, 63130000,
    ],
    cropConsumption: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    effects: [
      {
        effectId: 'woodProductionBonus',
        valuesPerLevel: [0, 1.05, 1.1, 1.15, 1.2, 1.25, 1.3, 1.35, 1.4, 1.45, 1.5, 1.55, 1.6, 1.65, 1.7, 1.75, 1.8, 1.85, 1.9, 1.95, 2],
      },
      {
        effectId: 'clayProductionBonus',
        valuesPerLevel: [0, 1.05, 1.1, 1.15, 1.2, 1.25, 1.3, 1.35, 1.4, 1.45, 1.5, 1.55, 1.6, 1.65, 1.7, 1.75, 1.8, 1.85, 1.9, 1.95, 2],
      },
      {
        effectId: 'ironProductionBonus',
        valuesPerLevel: [0, 1.05, 1.1, 1.15, 1.2, 1.25, 1.3, 1.35, 1.4, 1.45, 1.5, 1.55, 1.6, 1.65, 1.7, 1.75, 1.8, 1.85, 1.9, 1.95, 2],
      },
      {
        effectId: 'wheatProductionBonus',
        valuesPerLevel: [0, 1.05, 1.1, 1.15, 1.2, 1.25, 1.3, 1.35, 1.4, 1.45, 1.5, 1.55, 1.6, 1.65, 1.7, 1.75, 1.8, 1.85, 1.9, 1.95, 2],
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
  },
  {
    id: 'WOODCUTTER',
    category: 'resource-production',
    buildingDuration: [
      260000, 620000, 1190000, 2100000, 3560000, 5890000, 9620000, 15590000, 25150000, 40440000, 64900000, 104050000, 166680000, 266880000,
      427210000, 683730000, 1094170000, 1750880000, 2801600000, 4482770000, 7172630000, 11476400000,
    ],
    cropConsumption: [2, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3],
    buildingRequirements: [],
    effects: [
      {
        effectId: 'woodProduction',
        valuesPerLevel: [3, 7, 13, 21, 31, 46, 70, 98, 140, 203, 280, 392, 525, 693, 889, 1120, 1400, 1820, 2240, 2800, 3430],
      },
    ],
    baseBuildingCost: [40, 100, 50, 60],
    buildingCostCoefficient: 1.67,
    maxLevel: 22,
  },
  {
    id: 'ACADEMY',
    category: 'military',
    buildingDuration: [
      2000000, 2620000, 3340000, 4170000, 5140000, 6260000, 7570000, 9080000, 10830000, 12860000, 15220000, 17950000, 21130000, 24810000,
      29080000, 34030000, 39770000, 46440000, 54170000, 63130000,
    ],
    cropConsumption: [4, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4],
    effects: [],
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
  },
  {
    id: 'BARRACKS',
    category: 'military',
    buildingDuration: [
      2000000, 2620000, 3340000, 4170000, 5140000, 6260000, 7570000, 9080000, 10830000, 12860000, 15220000, 17950000, 21130000, 24810000,
      29080000, 34030000, 39770000, 46440000, 54170000, 63130000,
    ],
    cropConsumption: [4, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4],
    effects: [
      {
        effectId: 'barracksTrainingDuration',
        valuesPerLevel: [
          1, 1, 0.9091, 0.8333, 0.7143, 0.6667, 0.5882, 0.5263, 0.4762, 0.4348, 0.3846, 0.3448, 0.3125, 0.2857, 0.2564, 0.2273, 0.2041,
          0.1852, 0.1667, 0.1493, 0.1351,
        ],
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
  },
  {
    id: 'CITY_WALL',
    category: 'military',
    buildingDuration: [
      2000000, 2620000, 3340000, 4170000, 5140000, 6260000, 7570000, 9080000, 10830000, 12860000, 15220000, 17950000, 21130000, 24810000,
      29080000, 34030000, 39770000, 46440000, 54170000, 63130000,
    ],
    cropConsumption: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2],
    effects: [
      {
        effectId: 'infantryDefence',
        valuesPerLevel: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200],
      },
      {
        effectId: 'infantryDefenceBonus',
        valuesPerLevel: [
          1, 1.03, 1.06, 1.09, 1.13, 1.16, 1.19, 1.23, 1.27, 1.31, 1.34, 1.38, 1.43, 1.47, 1.51, 1.56, 1.6, 1.65, 1.7, 1.75, 1.81,
        ],
      },
      {
        effectId: 'cavalryDefence',
        valuesPerLevel: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200],
      },
      {
        effectId: 'cavalryDefenceBonus',
        valuesPerLevel: [
          1, 1.03, 1.06, 1.09, 1.13, 1.16, 1.19, 1.23, 1.27, 1.31, 1.34, 1.38, 1.43, 1.47, 1.51, 1.56, 1.6, 1.65, 1.7, 1.75, 1.81,
        ],
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
        type: 'tribe',
        tribe: 'romans',
      },
    ],
    baseBuildingCost: [70, 90, 170, 70],
    buildingCostCoefficient: 1.28,
    maxLevel: 20,
  },
  {
    id: 'EARTH_WALL',
    category: 'military',
    buildingDuration: [
      2000000, 2620000, 3340000, 4170000, 5140000, 6260000, 7570000, 9080000, 10830000, 12860000, 15220000, 17950000, 21130000, 24810000,
      29080000, 34030000, 39770000, 46440000, 54170000, 63130000,
    ],
    cropConsumption: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2],
    effects: [
      {
        effectId: 'infantryDefence',
        valuesPerLevel: [0, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72, 78, 84, 90, 96, 102, 108, 114, 120],
      },
      {
        effectId: 'infantryDefenceBonus',
        valuesPerLevel: [
          1, 1.02, 1.04, 1.06, 1.08, 1.1, 1.13, 1.15, 1.17, 1.2, 1.22, 1.24, 1.27, 1.29, 1.32, 1.35, 1.37, 1.4, 1.43, 1.46, 1.49,
        ],
      },
      {
        effectId: 'cavalryDefence',
        valuesPerLevel: [0, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72, 78, 84, 90, 96, 102, 108, 114, 120],
      },
      {
        effectId: 'cavalryDefenceBonus',
        valuesPerLevel: [
          1, 1.02, 1.04, 1.06, 1.08, 1.1, 1.13, 1.15, 1.17, 1.2, 1.22, 1.24, 1.27, 1.29, 1.32, 1.35, 1.37, 1.4, 1.43, 1.46, 1.49,
        ],
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
        type: 'tribe',
        tribe: 'teutons',
      },
    ],
    baseBuildingCost: [120, 200, 0, 80],
    buildingCostCoefficient: 1.28,
    maxLevel: 20,
  },
  {
    id: 'GREAT_BARRACKS',
    category: 'military',
    buildingDuration: [
      2000000, 2620000, 3340000, 4170000, 5140000, 6260000, 7570000, 9080000, 10830000, 12860000, 15220000, 17950000, 21130000, 24810000,
      29080000, 34030000, 39770000, 46440000, 54170000, 63130000,
    ],
    cropConsumption: [4, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4],
    effects: [
      {
        effectId: 'greatBarracksTrainingDuration',
        valuesPerLevel: [
          1, 1, 0.9091, 0.8333, 0.7143, 0.6667, 0.5882, 0.5263, 0.4762, 0.4348, 0.3846, 0.3448, 0.3125, 0.2857, 0.2564, 0.2273, 0.2041,
          0.1852, 0.1667, 0.1493, 0.1351,
        ],
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
        buildingId: 'BARRACKS',
        level: 20,
      },
      {
        id: 3,
        type: 'capital',
        canBuildOnlyInCapital: false,
        canBuildOnlyOutsideOfCapital: true,
      },
    ],
    baseBuildingCost: [630, 420, 780, 360],
    buildingCostCoefficient: 1.28,
    maxLevel: 20,
  },
  {
    id: 'GREAT_STABLE',
    category: 'military',
    buildingDuration: [
      2200000, 2850000, 3610000, 4490000, 5500000, 6680000, 8050000, 9640000, 11480000, 13620000, 16100000, 18980000, 22310000, 26180000,
      30670000, 35880000, 41920000, 48930000, 57060000, 66490000,
    ],
    cropConsumption: [5, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    effects: [
      {
        effectId: 'greatStableTrainingDuration',
        valuesPerLevel: [
          1, 1, 0.9091, 0.8333, 0.7143, 0.6667, 0.5882, 0.5263, 0.4762, 0.4348, 0.3846, 0.3448, 0.3125, 0.2857, 0.2564, 0.2273, 0.2041,
          0.1852, 0.1667, 0.1493, 0.1351,
        ],
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
        buildingId: 'STABLE',
        level: 20,
      },
      {
        id: 3,
        type: 'capital',
        canBuildOnlyInCapital: false,
        canBuildOnlyOutsideOfCapital: true,
      },
    ],
    baseBuildingCost: [780, 420, 660, 300],
    buildingCostCoefficient: 1.28,
    maxLevel: 20,
  },
  {
    id: 'HEROS_MANSION',
    category: 'military',
    buildingDuration: [
      2300000, 2670000, 3090000, 3590000, 4160000, 4830000, 5600000, 6500000, 7540000, 8750000, 10150000, 11770000, 13650000, 15840000,
      18370000, 21310000, 24720000, 28680000, 33260000, 38590000,
    ],
    cropConsumption: [2, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3],
    effects: [],
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
  },
  {
    id: 'HOSPITAL',
    category: 'military',
    buildingDuration: [
      2300000, 2670000, 3090000, 3590000, 4160000, 4830000, 5600000, 6500000, 7540000, 8750000, 10150000, 11770000, 13650000, 15840000,
      18370000, 21310000, 24720000, 28680000, 33260000, 38590000,
    ],
    cropConsumption: [3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    effects: [
      {
        effectId: 'hospitalTrainingDuration',
        valuesPerLevel: [
          1, 1, 0.9091, 0.8333, 0.7143, 0.6667, 0.5882, 0.5263, 0.4762, 0.4348, 0.3846, 0.3448, 0.3125, 0.2857, 0.2564, 0.2273, 0.2041,
          0.1852, 0.1667, 0.1493, 0.1351,
        ],
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
  },
  {
    id: 'MAKESHIFT_WALL',
    category: 'military',
    buildingDuration: [
      2300000, 2670000, 3090000, 3590000, 4160000, 4830000, 5600000, 6500000, 7540000, 8750000, 10150000, 11770000, 13650000, 15840000,
      18370000, 21310000, 24720000, 28680000, 33260000, 38590000,
    ],
    cropConsumption: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2],
    effects: [
      {
        effectId: 'infantryDefence',
        valuesPerLevel: [0, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72, 78, 84, 90, 96, 102, 108, 114, 120],
      },
      {
        effectId: 'infantryDefenceBonus',
        valuesPerLevel: [
          0, 1.02, 1.03, 1.05, 1.06, 1.08, 1.09, 1.11, 1.13, 1.14, 1.16, 1.18, 1.2, 1.21, 1.23, 1.25, 1.27, 1.29, 1.31, 1.33, 1.35,
        ],
      },
      {
        effectId: 'cavalryDefence',
        valuesPerLevel: [0, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72, 78, 84, 90, 96, 102, 108, 114, 120],
      },
      {
        effectId: 'cavalryDefenceBonus',
        valuesPerLevel: [
          0, 1.02, 1.03, 1.05, 1.06, 1.08, 1.09, 1.11, 1.13, 1.14, 1.16, 1.18, 1.2, 1.21, 1.23, 1.25, 1.27, 1.29, 1.31, 1.33, 1.35,
        ],
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
        type: 'tribe',
        tribe: 'huns',
      },
    ],
    baseBuildingCost: [50, 80, 40, 30],
    buildingCostCoefficient: 1.28,
    maxLevel: 20,
  },
  {
    id: 'PALISADE',
    category: 'military',
    buildingDuration: [
      2300000, 2670000, 3090000, 3590000, 4160000, 4830000, 5600000, 6500000, 7540000, 8750000, 10150000, 11770000, 13650000, 15840000,
      18370000, 21310000, 24720000, 28680000, 33260000, 38590000,
    ],
    cropConsumption: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2],
    effects: [
      {
        effectId: 'infantryDefence',
        valuesPerLevel: [0, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 104, 112, 120, 128, 136, 144, 152, 160],
      },
      {
        effectId: 'infantryDefenceBonus',
        valuesPerLevel: [
          0, 1.03, 1.05, 1.08, 1.1, 1.13, 1.16, 1.19, 1.22, 1.25, 1.28, 1.31, 1.35, 1.38, 1.41, 1.45, 1.49, 1.52, 1.56, 1.6, 1.64,
        ],
      },
      {
        effectId: 'cavalryDefence',
        valuesPerLevel: [0, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 104, 112, 120, 128, 136, 144, 152, 160],
      },
      {
        effectId: 'cavalryDefenceBonus',
        valuesPerLevel: [
          0, 1.03, 1.05, 1.08, 1.1, 1.13, 1.16, 1.19, 1.22, 1.25, 1.28, 1.31, 1.35, 1.38, 1.41, 1.45, 1.49, 1.52, 1.56, 1.6, 1.64,
        ],
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
        type: 'tribe',
        tribe: 'gauls',
      },
    ],
    baseBuildingCost: [160, 100, 80, 60],
    buildingCostCoefficient: 1.28,
    maxLevel: 20,
  },
  {
    id: 'RALLY_POINT',
    category: 'military',
    buildingDuration: [
      2300000, 2670000, 3090000, 3590000, 4160000, 4830000, 5600000, 6500000, 7540000, 8750000, 10150000, 11770000, 13650000, 15840000,
      18370000, 21310000, 24720000, 28680000, 33260000, 38590000,
    ],
    cropConsumption: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    effects: [],
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
  },
  {
    id: 'STABLE',
    category: 'military',
    buildingDuration: [
      2300000, 2670000, 3090000, 3590000, 4160000, 4830000, 5600000, 6500000, 7540000, 8750000, 10150000, 11770000, 13650000, 15840000,
      18370000, 21310000, 24720000, 28680000, 33260000, 38590000,
    ],
    cropConsumption: [5, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    effects: [
      {
        effectId: 'stableTrainingDuration',
        valuesPerLevel: [
          1, 1, 0.9091, 0.8333, 0.7143, 0.6667, 0.5882, 0.5263, 0.4762, 0.4348, 0.3846, 0.3448, 0.3125, 0.2857, 0.2564, 0.2273, 0.2041,
          0.1852, 0.1667, 0.1493, 0.1351,
        ],
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
        buildingId: 'ACADEMY',
        level: 5,
      },
    ],
    baseBuildingCost: [260, 140, 220, 100],
    buildingCostCoefficient: 1.28,
    maxLevel: 20,
  },
  {
    id: 'STONE_WALL',
    category: 'military',
    buildingDuration: [
      2300000, 2670000, 3090000, 3590000, 4160000, 4830000, 5600000, 6500000, 7540000, 8750000, 10150000, 11770000, 13650000, 15840000,
      18370000, 21310000, 24720000, 28680000, 33260000, 38590000,
    ],
    cropConsumption: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2],
    effects: [
      {
        effectId: 'infantryDefence',
        valuesPerLevel: [0, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 104, 112, 120, 128, 136, 144, 152, 160],
      },
      {
        effectId: 'infantryDefenceBonus',
        valuesPerLevel: [
          1, 1.03, 1.05, 1.08, 1.1, 1.13, 1.16, 1.19, 1.22, 1.25, 1.28, 1.31, 1.35, 1.38, 1.41, 1.45, 1.49, 1.52, 1.56, 1.6, 1.64,
        ],
      },
      {
        effectId: 'cavalryDefence',
        valuesPerLevel: [0, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 104, 112, 120, 128, 136, 144, 152, 160],
      },
      {
        effectId: 'cavalryDefenceBonus',
        valuesPerLevel: [
          1, 1.03, 1.05, 1.08, 1.1, 1.13, 1.16, 1.19, 1.22, 1.25, 1.28, 1.31, 1.35, 1.38, 1.41, 1.45, 1.49, 1.52, 1.56, 1.6, 1.64,
        ],
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
        type: 'tribe',
        tribe: 'egyptians',
      },
    ],
    baseBuildingCost: [110, 160, 70, 60],
    buildingCostCoefficient: 1.28,
    maxLevel: 20,
  },
  {
    id: 'TRAPPER',
    category: 'military',
    buildingDuration: [
      2300000, 2670000, 3090000, 3590000, 4160000, 4830000, 5600000, 6500000, 7540000, 8750000, 10150000, 11770000, 13650000, 15840000,
      18370000, 21310000, 24720000, 28680000, 33260000, 38590000,
    ],
    cropConsumption: [4, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4],
    effects: [
      {
        effectId: 'trapperCapacity',
        valuesPerLevel: [0, 10, 22, 35, 49, 64, 80, 97, 115, 134, 154, 175, 196, 218, 241, 265, 290, 316, 343, 371, 400],
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
  },
  {
    id: 'WORKSHOP',
    category: 'military',
    buildingDuration: [
      2300000, 2670000, 3090000, 3590000, 4160000, 4830000, 5600000, 6500000, 7540000, 8750000, 10150000, 11770000, 13650000, 15840000,
      18370000, 21310000, 24720000, 28680000, 33260000, 38590000,
    ],
    cropConsumption: [3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    effects: [
      {
        effectId: 'workshopTrainingDuration',
        valuesPerLevel: [
          1, 0.9091, 0.8333, 0.7143, 0.6667, 0.5882, 0.5263, 0.4762, 0.4348, 0.3846, 0.3448, 0.3125, 0.2857, 0.2564, 0.2273, 0.2041, 0.1852,
          0.1667, 0.1493, 0.1351,
        ],
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
  },
  {
    id: 'BREWERY',
    category: 'infrastructure',
    buildingDuration: [
      2300000, 2670000, 3090000, 3590000, 4160000, 4830000, 5600000, 6500000, 7540000, 8750000, 10150000, 11770000, 13650000, 15840000,
      18370000, 21310000, 24720000, 28680000, 33260000, 38590000,
    ],
    cropConsumption: [6, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5],
    effects: [
      {
        effectId: 'attackBonus',
        valuesPerLevel: [
          1, 1.01, 1.02, 1.03, 1.04, 1.05, 1.06, 1.07, 1.08, 1.09, 1.1, 1.11, 1.12, 1.13, 1.14, 1.15, 1.16, 1.17, 1.18, 1.19, 1.2,
        ],
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
      {
        id: 5,
        type: 'capital',
        canBuildOnlyInCapital: true,
        canBuildOnlyOutsideOfCapital: false,
      },
    ],
    baseBuildingCost: [3210, 2050, 2750, 3830],
    buildingCostCoefficient: 1.4,
    maxLevel: 20,
  },
  {
    id: 'COMMAND_CENTER',
    category: 'infrastructure',
    buildingDuration: [
      2300000, 2670000, 3090000, 3590000, 4160000, 4830000, 5600000, 6500000, 7540000, 8750000, 10150000, 11770000, 13650000, 15840000,
      18370000, 21310000, 24720000, 28680000, 33260000, 38590000,
    ],
    cropConsumption: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    effects: [
      {
        effectId: 'infantryDefence',
        valuesPerLevel: [0, 2, 8, 18, 32, 50, 72, 98, 128, 162, 200, 242, 288, 338, 392, 450, 512, 578, 648, 722, 800],
      },
      {
        effectId: 'cavalryDefence',
        valuesPerLevel: [0, 2, 8, 18, 32, 50, 72, 98, 128, 162, 200, 242, 288, 338, 392, 450, 512, 578, 648, 722, 800],
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
  },
  {
    id: 'CRANNY',
    category: 'infrastructure',
    buildingDuration: [2300000, 2670000, 3090000, 3590000, 4160000, 4830000, 5600000, 6500000, 7540000, 8750000],
    cropConsumption: [0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
    effects: [
      {
        effectId: 'crannyCapacity',
        valuesPerLevel: [0, 100, 130, 170, 220, 280, 360, 460, 600, 770, 1000],
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
  },
  {
    id: 'HORSE_DRINKING_TROUGH',
    category: 'infrastructure',
    buildingDuration: [
      2300000, 2670000, 3090000, 3590000, 4160000, 4830000, 5600000, 6500000, 7540000, 8750000, 10150000, 11770000, 13650000, 15840000,
      18370000, 21310000, 24720000, 28680000, 33260000, 38590000,
    ],
    cropConsumption: [5, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    effects: [
      {
        effectId: 'stableTrainingDuration',
        valuesPerLevel: [
          1, 0.99, 0.98, 0.97, 0.96, 0.95, 0.94, 0.93, 0.92, 0.91, 0.9, 0.89, 0.88, 0.86, 0.85, 0.84, 0.83, 0.82, 0.81, 0.8, 0.78, 0.77,
          0.75,
        ],
      },
      {
        effectId: 'greatStableTrainingDuration',
        valuesPerLevel: [
          1, 0.99, 0.98, 0.97, 0.96, 0.95, 0.94, 0.93, 0.92, 0.91, 0.9, 0.89, 0.88, 0.86, 0.85, 0.84, 0.83, 0.82, 0.81, 0.8, 0.78, 0.77,
          0.75,
        ],
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
  },
  {
    id: 'MAIN_BUILDING',
    category: 'infrastructure',
    buildingDuration: [
      2300000, 2670000, 3090000, 3590000, 4160000, 4830000, 5600000, 6500000, 7540000, 8750000, 10150000, 11770000, 13650000, 15840000,
      18370000, 21310000, 24720000, 28680000, 33260000, 38590000,
    ],
    cropConsumption: [2, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3],
    effects: [
      {
        effectId: 'buildingDuration',
        valuesPerLevel: [
          1, 1, 0.98, 0.96, 0.94, 0.91, 0.89, 0.87, 0.85, 0.83, 0.81, 0.78, 0.75, 0.73, 0.7, 0.67, 0.64, 0.6, 0.57, 0.54, 0.5,
        ],
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
  },
  {
    id: 'MARKETPLACE',
    category: 'infrastructure',
    buildingDuration: [
      2300000, 2670000, 3090000, 3590000, 4160000, 4830000, 5600000, 6500000, 7540000, 8750000, 10150000, 11770000, 13650000, 15840000,
      18370000, 21310000, 24720000, 28680000, 33260000, 38590000,
    ],
    cropConsumption: [4, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4],
    effects: [],
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
  },
  {
    id: 'PALACE',
    category: 'infrastructure',
    buildingDuration: [
      2300000, 2670000, 3090000, 3590000, 4160000, 4830000, 5600000, 6500000, 7540000, 8750000, 10150000, 11770000, 13650000, 15840000,
      18370000, 21310000, 24720000, 28680000, 33260000, 38590000,
    ],
    cropConsumption: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    effects: [
      {
        effectId: 'infantryDefence',
        valuesPerLevel: [0, 2, 8, 18, 32, 50, 72, 98, 128, 162, 200, 242, 288, 338, 392, 450, 512, 578, 648, 722, 800],
      },
      {
        effectId: 'cavalryDefence',
        valuesPerLevel: [0, 2, 8, 18, 32, 50, 72, 98, 128, 162, 200, 242, 288, 338, 392, 450, 512, 578, 648, 722, 800],
      },
    ],
    buildingRequirements: [
      {
        id: 1,
        type: 'amount',
        amount: 1,
        appliesGlobally: true,
      },
      {
        id: 2,
        type: 'building',
        buildingId: 'MAIN_BUILDING',
        level: 5,
      },
    ],
    baseBuildingCost: [550, 800, 750, 250],
    buildingCostCoefficient: 1.28,
    maxLevel: 20,
  },
  {
    id: 'RESIDENCE',
    category: 'infrastructure',
    buildingDuration: [
      2300000, 2670000, 3090000, 3590000, 4160000, 4830000, 5600000, 6500000, 7540000, 8750000, 10150000, 11770000, 13650000, 15840000,
      18370000, 21310000, 24720000, 28680000, 33260000, 38590000,
    ],
    cropConsumption: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    effects: [
      {
        effectId: 'infantryDefence',
        valuesPerLevel: [0, 2, 8, 18, 32, 50, 72, 98, 128, 162, 200, 242, 288, 338, 392, 450, 512, 578, 648, 722, 800],
      },
      {
        effectId: 'cavalryDefence',
        valuesPerLevel: [0, 2, 8, 18, 32, 50, 72, 98, 128, 162, 200, 242, 288, 338, 392, 450, 512, 578, 648, 722, 800],
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
        buildingId: 'MAIN_BUILDING',
        level: 5,
      },
      {
        id: 3,
        type: 'capital',
        canBuildOnlyInCapital: false,
        canBuildOnlyOutsideOfCapital: true,
      },
    ],
    baseBuildingCost: [580, 460, 350, 180],
    buildingCostCoefficient: 1.28,
    maxLevel: 20,
  },
  {
    id: 'TREASURY',
    category: 'infrastructure',
    buildingDuration: [
      2300000, 2670000, 3090000, 3590000, 4160000, 4830000, 5600000, 6500000, 7540000, 8750000, 10150000, 11770000, 13650000, 15840000,
      18370000, 21310000, 24720000, 28680000, 33260000, 38590000,
    ],
    cropConsumption: [4, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4],
    effects: [],
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
  },
  {
    id: 'TOURNAMENT_SQUARE',
    category: 'military',
    buildingDuration: [
      3500, 4360, 5360, 6510, 7860, 9410, 11220, 13320, 15750, 18570, 21840, 25630, 30030, 35140, 41060, 47930, 55900, 65140, 75860, 88300,
    ],
    cropConsumption: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    effects: [
      {
        effectId: 'unitSpeedBonus',
        valuesPerLevel: [1, 1.2, 1.4, 1.6, 1.8, 2, 2.2, 2.4, 2.6, 2.8, 3, 3.2, 3.4, 3.6, 3.8, 4, 4.2, 4.4, 4.6, 4.8, 5],
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
  },
];

// Use this for faster lookups
export const buildingMap = new Map<Building['id'], Building>(buildings.map((building) => [building.id, building]));
