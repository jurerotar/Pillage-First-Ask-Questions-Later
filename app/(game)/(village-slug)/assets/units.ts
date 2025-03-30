import type { Unit } from 'app/interfaces/models/game/unit';

export const romanUnits: Unit[] = [
  {
    id: 'LEGIONNAIRE',
    baseRecruitmentCost: [120, 100, 150, 30],
    baseRecruitmentDuration: 1600,
    unitWheatConsumption: 1,
    attack: 40,
    infantryDefence: 35,
    cavalryDefence: 50,
    unitSpeed: 6,
    unitCarryCapacity: 50,
    category: 'infantry',
    tribe: 'romans',
    tier: 'tier-1',
    researchRequirements: [],
  },
  {
    id: 'PRAETORIAN',
    baseRecruitmentCost: [100, 130, 160, 70],
    baseRecruitmentDuration: 1760,
    unitWheatConsumption: 1,
    attack: 30,
    infantryDefence: 65,
    cavalryDefence: 35,
    unitSpeed: 5,
    unitCarryCapacity: 20,
    category: 'infantry',
    tribe: 'romans',
    tier: 'tier-2',
    researchRequirements: [{ buildingId: 'ACADEMY', level: 1 }],
  },
  {
    id: 'IMPERIAN',
    baseRecruitmentCost: [150, 160, 210, 80],
    baseRecruitmentDuration: 1920,
    unitWheatConsumption: 1,
    attack: 70,
    infantryDefence: 40,
    cavalryDefence: 25,
    unitSpeed: 7,
    unitCarryCapacity: 50,
    category: 'infantry',
    tribe: 'romans',
    tier: 'tier-3',
    researchRequirements: [{ buildingId: 'ACADEMY', level: 5 }],
  },
  {
    id: 'EQUITES_LEGATI',
    baseRecruitmentCost: [140, 160, 20, 40],
    baseRecruitmentDuration: 1360,
    unitWheatConsumption: 2,
    attack: 0,
    infantryDefence: 20,
    cavalryDefence: 10,
    unitSpeed: 16,
    unitCarryCapacity: 0,
    category: 'cavalry',
    tribe: 'romans',
    tier: 'scout',
    researchRequirements: [
      { buildingId: 'ACADEMY', level: 5 },
      { buildingId: 'STABLE', level: 1 },
    ],
  },
  {
    id: 'EQUITES_IMPERATORIS',
    baseRecruitmentCost: [550, 440, 320, 100],
    baseRecruitmentDuration: 2640,
    unitWheatConsumption: 3,
    attack: 120,
    infantryDefence: 65,
    cavalryDefence: 50,
    unitSpeed: 14,
    unitCarryCapacity: 100,
    category: 'cavalry',
    tribe: 'romans',
    tier: 'tier-4',
    researchRequirements: [
      { buildingId: 'ACADEMY', level: 5 },
      { buildingId: 'STABLE', level: 5 },
    ],
  },
  {
    id: 'EQUITES_CAESARIS',
    baseRecruitmentCost: [550, 640, 800, 180],
    baseRecruitmentDuration: 3520,
    unitWheatConsumption: 4,
    attack: 180,
    infantryDefence: 80,
    cavalryDefence: 105,
    unitSpeed: 10,
    unitCarryCapacity: 70,
    category: 'cavalry',
    tribe: 'romans',
    tier: 'tier-5',
    researchRequirements: [
      { buildingId: 'ACADEMY', level: 15 },
      { buildingId: 'STABLE', level: 10 },
    ],
  },
  {
    id: 'ROMAN_RAM',
    baseRecruitmentCost: [900, 360, 500, 70],
    baseRecruitmentDuration: 4600,
    unitWheatConsumption: 3,
    attack: 60,
    infantryDefence: 30,
    cavalryDefence: 75,
    unitSpeed: 4,
    unitCarryCapacity: 0,
    category: 'siege',
    tribe: 'romans',
    tier: 'siege-ram',
    researchRequirements: [
      { buildingId: 'ACADEMY', level: 10 },
      { buildingId: 'WORKSHOP', level: 1 },
    ],
  },
  {
    id: 'ROMAN_CATAPULT',
    baseRecruitmentCost: [950, 1350, 600, 90],
    baseRecruitmentDuration: 9000,
    unitWheatConsumption: 6,
    attack: 75,
    infantryDefence: 60,
    cavalryDefence: 10,
    unitSpeed: 3,
    unitCarryCapacity: 0,
    category: 'siege',
    tribe: 'romans',
    tier: 'siege-catapult',
    researchRequirements: [
      { buildingId: 'ACADEMY', level: 15 },
      { buildingId: 'WORKSHOP', level: 10 },
    ],
  },
  {
    id: 'SENATOR',
    baseRecruitmentCost: [30750, 27200, 45000, 37500],
    baseRecruitmentDuration: 90700,
    unitWheatConsumption: 5,
    attack: 50,
    infantryDefence: 40,
    cavalryDefence: 30,
    unitSpeed: 4,
    unitCarryCapacity: 0,
    category: 'special',
    tribe: 'romans',
    tier: 'special',
    researchRequirements: [
      { buildingId: 'RALLY_POINT', level: 10 },
      { buildingId: 'ACADEMY', level: 20 },
    ],
  },
  {
    id: 'ROMAN_SETTLER',
    baseRecruitmentCost: [4600, 4200, 5800, 4400],
    baseRecruitmentDuration: 26900,
    unitWheatConsumption: 1,
    attack: 0,
    infantryDefence: 80,
    cavalryDefence: 80,
    unitSpeed: 5,
    unitCarryCapacity: 3000,
    category: 'special',
    tribe: 'romans',
    tier: 'special',
    researchRequirements: [],
  },
];

export const gaulUnits: Unit[] = [
  {
    id: 'PHALANX',
    baseRecruitmentCost: [100, 130, 55, 30],
    baseRecruitmentDuration: 1040,
    unitWheatConsumption: 1,
    attack: 15,
    infantryDefence: 40,
    cavalryDefence: 50,
    unitSpeed: 7,
    unitCarryCapacity: 35,
    category: 'infantry',
    tribe: 'gauls',
    tier: 'tier-1',
    researchRequirements: [],
  },
  {
    id: 'SWORDSMAN',
    baseRecruitmentCost: [140, 150, 185, 60],
    baseRecruitmentDuration: 1440,
    unitWheatConsumption: 1,
    attack: 65,
    infantryDefence: 35,
    cavalryDefence: 20,
    unitSpeed: 6,
    unitCarryCapacity: 45,
    category: 'infantry',
    tribe: 'gauls',
    tier: 'tier-2',
    researchRequirements: [{ buildingId: 'ACADEMY', level: 3 }],
  },
  {
    id: 'PATHFINDER',
    baseRecruitmentCost: [170, 150, 20, 40],
    baseRecruitmentDuration: 1360,
    unitWheatConsumption: 2,
    attack: 0,
    infantryDefence: 20,
    cavalryDefence: 10,
    unitSpeed: 17,
    unitCarryCapacity: 0,
    category: 'cavalry',
    tribe: 'gauls',
    tier: 'scout',
    researchRequirements: [
      { buildingId: 'ACADEMY', level: 5 },
      { buildingId: 'STABLE', level: 1 },
    ],
  },
  {
    id: 'THEUTATES_THUNDER',
    baseRecruitmentCost: [350, 450, 230, 60],
    baseRecruitmentDuration: 2480,
    unitWheatConsumption: 2,
    attack: 90,
    infantryDefence: 25,
    cavalryDefence: 40,
    unitSpeed: 19,
    unitCarryCapacity: 75,
    category: 'cavalry',
    tribe: 'gauls',
    tier: 'tier-3',
    researchRequirements: [
      { buildingId: 'ACADEMY', level: 5 },
      { buildingId: 'STABLE', level: 3 },
    ],
  },
  {
    id: 'DRUIDRIDER',
    baseRecruitmentCost: [360, 330, 280, 120],
    baseRecruitmentDuration: 2560,
    unitWheatConsumption: 2,
    attack: 45,
    infantryDefence: 115,
    cavalryDefence: 55,
    unitSpeed: 16,
    unitCarryCapacity: 35,
    category: 'cavalry',
    tribe: 'gauls',
    tier: 'tier-4',
    researchRequirements: [
      { buildingId: 'ACADEMY', level: 5 },
      { buildingId: 'STABLE', level: 5 },
    ],
  },
  {
    id: 'HAEDUAN',
    baseRecruitmentCost: [500, 620, 675, 170],
    baseRecruitmentDuration: 3120,
    unitWheatConsumption: 3,
    attack: 140,
    infantryDefence: 60,
    cavalryDefence: 165,
    unitSpeed: 13,
    unitCarryCapacity: 65,
    category: 'cavalry',
    tribe: 'gauls',
    tier: 'tier-5',
    researchRequirements: [
      { buildingId: 'ACADEMY', level: 15 },
      { buildingId: 'STABLE', level: 10 },
    ],
  },
  {
    id: 'GAUL_RAM',
    baseRecruitmentCost: [950, 555, 330, 75],
    baseRecruitmentDuration: 5000,
    unitWheatConsumption: 3,
    attack: 50,
    infantryDefence: 30,
    cavalryDefence: 105,
    unitSpeed: 4,
    unitCarryCapacity: 0,
    category: 'siege',
    tribe: 'gauls',
    tier: 'siege-ram',
    researchRequirements: [
      { buildingId: 'ACADEMY', level: 10 },
      { buildingId: 'WORKSHOP', level: 1 },
    ],
  },
  {
    id: 'GAUL_CATAPULT',
    baseRecruitmentCost: [960, 1450, 630, 90],
    baseRecruitmentDuration: 9000,
    unitWheatConsumption: 6,
    attack: 70,
    infantryDefence: 45,
    cavalryDefence: 10,
    unitSpeed: 3,
    unitCarryCapacity: 0,
    category: 'siege',
    tribe: 'gauls',
    tier: 'siege-catapult',
    researchRequirements: [
      { buildingId: 'ACADEMY', level: 15 },
      { buildingId: 'WORKSHOP', level: 10 },
    ],
  },
  {
    id: 'CHIEFTAIN',
    baseRecruitmentCost: [30750, 45400, 31000, 37500],
    baseRecruitmentDuration: 90700,
    unitWheatConsumption: 4,
    attack: 40,
    infantryDefence: 50,
    cavalryDefence: 50,
    unitSpeed: 5,
    unitCarryCapacity: 0,
    category: 'special',
    tribe: 'gauls',
    tier: 'special',
    researchRequirements: [
      { buildingId: 'RALLY_POINT', level: 10 },
      { buildingId: 'ACADEMY', level: 20 },
    ],
  },
  {
    id: 'GAUL_SETTLER',
    baseRecruitmentCost: [4400, 5600, 4200, 3900],
    baseRecruitmentDuration: 22700,
    unitWheatConsumption: 1,
    attack: 0,
    infantryDefence: 80,
    cavalryDefence: 80,
    unitSpeed: 5,
    unitCarryCapacity: 3000,
    category: 'special',
    tribe: 'gauls',
    tier: 'special',
    researchRequirements: [],
  },
];

export const teutonUnits: Unit[] = [
  {
    id: 'MACEMAN',
    baseRecruitmentCost: [95, 75, 40, 40],
    baseRecruitmentDuration: 720,
    unitWheatConsumption: 1,
    attack: 40,
    infantryDefence: 20,
    cavalryDefence: 5,
    unitSpeed: 7,
    unitCarryCapacity: 60,
    category: 'infantry',
    tribe: 'teutons',
    tier: 'tier-1',
    researchRequirements: [],
  },
  {
    id: 'SPEARMAN',
    baseRecruitmentCost: [145, 70, 85, 40],
    baseRecruitmentDuration: 1120,
    unitWheatConsumption: 1,
    attack: 10,
    infantryDefence: 35,
    cavalryDefence: 60,
    unitSpeed: 7,
    unitCarryCapacity: 40,
    category: 'infantry',
    tribe: 'teutons',
    tier: 'tier-2',
    researchRequirements: [
      { buildingId: 'ACADEMY', level: 1 },
      { buildingId: 'BARRACKS', level: 3 },
    ],
  },
  {
    id: 'AXEMAN',
    baseRecruitmentCost: [130, 120, 170, 70],
    baseRecruitmentDuration: 1200,
    unitWheatConsumption: 1,
    attack: 60,
    infantryDefence: 30,
    cavalryDefence: 30,
    unitSpeed: 6,
    unitCarryCapacity: 50,
    category: 'infantry',
    tribe: 'teutons',
    tier: 'tier-3',
    researchRequirements: [{ buildingId: 'ACADEMY', level: 3 }],
  },
  {
    id: 'SCOUT',
    baseRecruitmentCost: [160, 100, 50, 50],
    baseRecruitmentDuration: 1120,
    unitWheatConsumption: 1,
    attack: 0,
    infantryDefence: 10,
    cavalryDefence: 5,
    unitSpeed: 9,
    unitCarryCapacity: 0,
    category: 'infantry',
    tribe: 'teutons',
    tier: 'scout',
    researchRequirements: [
      { buildingId: 'ACADEMY', level: 1 },
      { buildingId: 'MAIN_BUILDING', level: 5 },
    ],
  },
  {
    id: 'PALADIN',
    baseRecruitmentCost: [370, 270, 290, 75],
    baseRecruitmentDuration: 2400,
    unitWheatConsumption: 2,
    attack: 55,
    infantryDefence: 100,
    cavalryDefence: 40,
    unitSpeed: 10,
    unitCarryCapacity: 110,
    category: 'cavalry',
    tribe: 'teutons',
    tier: 'tier-4',
    researchRequirements: [
      { buildingId: 'ACADEMY', level: 5 },
      { buildingId: 'STABLE', level: 5 },
    ],
  },
  {
    id: 'TEUTONIC_KNIGHT',
    baseRecruitmentCost: [450, 515, 480, 80],
    baseRecruitmentDuration: 2960,
    unitWheatConsumption: 3,
    attack: 150,
    infantryDefence: 50,
    cavalryDefence: 75,
    unitSpeed: 9,
    unitCarryCapacity: 80,
    category: 'cavalry',
    tribe: 'teutons',
    tier: 'tier-5',
    researchRequirements: [
      { buildingId: 'ACADEMY', level: 15 },
      { buildingId: 'STABLE', level: 10 },
    ],
  },
  {
    id: 'TEUTONIC_RAM',
    baseRecruitmentCost: [1000, 300, 350, 70],
    baseRecruitmentDuration: 4200,
    unitWheatConsumption: 3,
    attack: 65,
    infantryDefence: 30,
    cavalryDefence: 80,
    unitSpeed: 4,
    unitCarryCapacity: 0,
    category: 'siege',
    tribe: 'teutons',
    tier: 'siege-ram',
    researchRequirements: [
      { buildingId: 'ACADEMY', level: 15 },
      { buildingId: 'WORKSHOP', level: 1 },
    ],
  },
  {
    id: 'TEUTONIC_CATAPULT',
    baseRecruitmentCost: [900, 1200, 600, 60],
    baseRecruitmentDuration: 9000,
    unitWheatConsumption: 6,
    attack: 50,
    infantryDefence: 60,
    cavalryDefence: 10,
    unitSpeed: 3,
    unitCarryCapacity: 0,
    category: 'siege',
    tribe: 'teutons',
    tier: 'siege-catapult',
    researchRequirements: [
      { buildingId: 'ACADEMY', level: 15 },
      { buildingId: 'WORKSHOP', level: 10 },
    ],
  },
  {
    id: 'CHIEF',
    baseRecruitmentCost: [35500, 26600, 25000, 27200],
    baseRecruitmentDuration: 70500,
    unitWheatConsumption: 4,
    attack: 40,
    infantryDefence: 60,
    cavalryDefence: 40,
    unitSpeed: 4,
    unitCarryCapacity: 0,
    category: 'special',
    tribe: 'teutons',
    tier: 'special',
    researchRequirements: [
      { buildingId: 'ACADEMY', level: 20 },
      { buildingId: 'RALLY_POINT', level: 5 },
    ],
  },
  {
    id: 'TEUTONIC_SETTLER',
    baseRecruitmentCost: [5800, 4400, 4600, 5200],
    baseRecruitmentDuration: 31000,
    unitWheatConsumption: 1,
    attack: 0,
    infantryDefence: 80,
    cavalryDefence: 80,
    unitSpeed: 5,
    unitCarryCapacity: 3000,
    category: 'special',
    tribe: 'teutons',
    tier: 'special',
    researchRequirements: [],
  },
];

export const egyptianUnits: Unit[] = [
  {
    id: 'SLAVE_MILITIA',
    baseRecruitmentCost: [45, 60, 30, 15],
    baseRecruitmentDuration: 530,
    unitWheatConsumption: 1,
    attack: 10,
    infantryDefence: 30,
    cavalryDefence: 20,
    unitSpeed: 7,
    unitCarryCapacity: 15,
    category: 'infantry',
    tribe: 'egyptians',
    tier: 'tier-1',
    researchRequirements: [],
  },
  {
    id: 'ASH_WARDEN',
    baseRecruitmentCost: [115, 100, 145, 60],
    baseRecruitmentDuration: 1320,
    unitWheatConsumption: 1,
    attack: 30,
    infantryDefence: 55,
    cavalryDefence: 40,
    unitSpeed: 6,
    unitCarryCapacity: 50,
    category: 'infantry',
    tribe: 'egyptians',
    tier: 'tier-2',
    researchRequirements: [{ buildingId: 'ACADEMY', level: 1 }],
  },
  {
    id: 'KHOPESH_WARRIOR',
    baseRecruitmentCost: [170, 180, 220, 80],
    baseRecruitmentDuration: 1440,
    unitWheatConsumption: 1,
    attack: 65,
    infantryDefence: 50,
    cavalryDefence: 20,
    unitSpeed: 7,
    unitCarryCapacity: 45,
    category: 'infantry',
    tribe: 'egyptians',
    tier: 'tier-3',
    researchRequirements: [{ buildingId: 'ACADEMY', level: 5 }],
  },
  {
    id: 'SOPDU_EXPLORER',
    baseRecruitmentCost: [170, 150, 20, 40],
    baseRecruitmentDuration: 1360,
    unitWheatConsumption: 2,
    attack: 0,
    infantryDefence: 20,
    cavalryDefence: 10,
    unitSpeed: 16,
    unitCarryCapacity: 0,
    category: 'infantry',
    tribe: 'egyptians',
    tier: 'scout',
    researchRequirements: [
      { buildingId: 'STABLE', level: 1 },
      { buildingId: 'ACADEMY', level: 5 },
    ],
  },
  {
    id: 'ANHUR_GUARD',
    baseRecruitmentCost: [360, 330, 280, 120],
    baseRecruitmentDuration: 2560,
    unitWheatConsumption: 2,
    attack: 50,
    infantryDefence: 110,
    cavalryDefence: 50,
    unitSpeed: 15,
    unitCarryCapacity: 50,
    category: 'infantry',
    tribe: 'egyptians',
    tier: 'tier-4',
    researchRequirements: [
      { buildingId: 'STABLE', level: 5 },
      { buildingId: 'ACADEMY', level: 5 },
    ],
  },
  {
    id: 'RESHEPH_CHARIOT',
    baseRecruitmentCost: [450, 560, 610, 180],
    baseRecruitmentDuration: 3240,
    unitWheatConsumption: 3,
    attack: 110,
    infantryDefence: 120,
    cavalryDefence: 150,
    unitSpeed: 10,
    unitCarryCapacity: 70,
    category: 'infantry',
    tribe: 'egyptians',
    tier: 'tier-5',
    researchRequirements: [
      { buildingId: 'STABLE', level: 10 },
      { buildingId: 'ACADEMY', level: 15 },
    ],
  },
  {
    id: 'EGYPTIAN_RAM',
    baseRecruitmentCost: [995, 575, 340, 80],
    baseRecruitmentDuration: 4800,
    unitWheatConsumption: 3,
    attack: 55,
    infantryDefence: 30,
    cavalryDefence: 95,
    unitSpeed: 4,
    unitCarryCapacity: 0,
    category: 'siege',
    tribe: 'egyptians',
    tier: 'siege-ram',
    researchRequirements: [
      { buildingId: 'WORKSHOP', level: 1 },
      { buildingId: 'ACADEMY', level: 10 },
    ],
  },
  {
    id: 'EGYPTIAN_CATAPULT',
    baseRecruitmentCost: [980, 1510, 660, 100],
    baseRecruitmentDuration: 9000,
    unitWheatConsumption: 6,
    attack: 65,
    infantryDefence: 55,
    cavalryDefence: 10,
    unitSpeed: 3,
    unitCarryCapacity: 0,
    category: 'siege',
    tribe: 'egyptians',
    tier: 'siege-catapult',
    researchRequirements: [
      { buildingId: 'WORKSHOP', level: 10 },
      { buildingId: 'ACADEMY', level: 15 },
    ],
  },
  {
    id: 'NOMARCH',
    baseRecruitmentCost: [34000, 50000, 34000, 42000],
    baseRecruitmentDuration: 90700,
    unitWheatConsumption: 4,
    attack: 40,
    infantryDefence: 50,
    cavalryDefence: 50,
    unitSpeed: 4,
    unitCarryCapacity: 0,
    category: 'infantry',
    tribe: 'egyptians',
    tier: 'special',
    researchRequirements: [
      { buildingId: 'RALLY_POINT', level: 10 },
      { buildingId: 'ACADEMY', level: 20 },
    ],
  },
  {
    id: 'EGYPTIAN_SETTLER',
    baseRecruitmentCost: [5040, 6510, 4830, 4620],
    baseRecruitmentDuration: 24800,
    unitWheatConsumption: 1,
    attack: 0,
    infantryDefence: 80,
    cavalryDefence: 80,
    unitSpeed: 5,
    unitCarryCapacity: 3000,
    category: 'infantry',
    tribe: 'egyptians',
    tier: 'special',
    researchRequirements: [],
  },
];

export const hunUnits: Unit[] = [
  {
    id: 'MERCENARY',
    baseRecruitmentCost: [130, 80, 40, 40],
    baseRecruitmentDuration: 810,
    unitWheatConsumption: 1,
    attack: 35,
    infantryDefence: 40,
    cavalryDefence: 30,
    unitSpeed: 6,
    unitCarryCapacity: 50,
    category: 'infantry',
    tribe: 'huns',
    tier: 'tier-1',
    researchRequirements: [],
  },
  {
    id: 'BOWMAN',
    baseRecruitmentCost: [140, 110, 60, 60],
    baseRecruitmentDuration: 1120,
    unitWheatConsumption: 1,
    attack: 50,
    infantryDefence: 30,
    cavalryDefence: 10,
    unitSpeed: 6,
    unitCarryCapacity: 30,
    category: 'infantry',
    tribe: 'huns',
    tier: 'tier-2',
    researchRequirements: [{ buildingId: 'ACADEMY', level: 3 }],
  },
  {
    id: 'SPOTTER',
    baseRecruitmentCost: [170, 150, 20, 40],
    baseRecruitmentDuration: 1360,
    unitWheatConsumption: 2,
    attack: 0,
    infantryDefence: 20,
    cavalryDefence: 10,
    unitSpeed: 19,
    unitCarryCapacity: 0,
    category: 'infantry',
    tribe: 'huns',
    tier: 'scout',
    researchRequirements: [
      { buildingId: 'STABLE', level: 1 },
      { buildingId: 'ACADEMY', level: 5 },
    ],
  },
  {
    id: 'STEPPE_RIDER',
    baseRecruitmentCost: [290, 370, 190, 45],
    baseRecruitmentDuration: 2400,
    unitWheatConsumption: 2,
    attack: 120,
    infantryDefence: 30,
    cavalryDefence: 15,
    unitSpeed: 16,
    unitCarryCapacity: 75,
    category: 'infantry',
    tribe: 'huns',
    tier: 'tier-3',
    researchRequirements: [
      { buildingId: 'STABLE', level: 3 },
      { buildingId: 'ACADEMY', level: 5 },
    ],
  },
  {
    id: 'MARKSMAN',
    baseRecruitmentCost: [320, 350, 330, 50],
    baseRecruitmentDuration: 2480,
    unitWheatConsumption: 2,
    attack: 115,
    infantryDefence: 80,
    cavalryDefence: 70,
    unitSpeed: 16,
    unitCarryCapacity: 105,
    category: 'infantry',
    tribe: 'huns',
    tier: 'tier-4',
    researchRequirements: [
      { buildingId: 'STABLE', level: 5 },
      { buildingId: 'ACADEMY', level: 5 },
    ],
  },
  {
    id: 'MARAUDER',
    baseRecruitmentCost: [450, 560, 610, 140],
    baseRecruitmentDuration: 2990,
    unitWheatConsumption: 3,
    attack: 180,
    infantryDefence: 60,
    cavalryDefence: 40,
    unitSpeed: 14,
    unitCarryCapacity: 80,
    category: 'infantry',
    tribe: 'huns',
    tier: 'tier-5',
    researchRequirements: [
      { buildingId: 'STABLE', level: 10 },
      { buildingId: 'ACADEMY', level: 15 },
    ],
  },
  {
    id: 'HUN_RAM',
    baseRecruitmentCost: [1060, 330, 360, 70],
    baseRecruitmentDuration: 4400,
    unitWheatConsumption: 3,
    attack: 65,
    infantryDefence: 30,
    cavalryDefence: 90,
    unitSpeed: 4,
    unitCarryCapacity: 0,
    category: 'siege',
    tribe: 'huns',
    tier: 'siege-ram',
    researchRequirements: [
      { buildingId: 'WORKSHOP', level: 1 },
      { buildingId: 'ACADEMY', level: 10 },
    ],
  },
  {
    id: 'HUN_CATAPULT',
    baseRecruitmentCost: [950, 1280, 620, 60],
    baseRecruitmentDuration: 9000,
    unitWheatConsumption: 6,
    attack: 45,
    infantryDefence: 55,
    cavalryDefence: 10,
    unitSpeed: 3,
    unitCarryCapacity: 0,
    category: 'siege',
    tribe: 'huns',
    tier: 'siege-catapult',
    researchRequirements: [
      { buildingId: 'WORKSHOP', level: 10 },
      { buildingId: 'ACADEMY', level: 15 },
    ],
  },
  {
    id: 'LOGADES',
    baseRecruitmentCost: [37200, 27600, 25200, 27600],
    baseRecruitmentDuration: 90700,
    unitWheatConsumption: 4,
    attack: 50,
    infantryDefence: 40,
    cavalryDefence: 30,
    unitSpeed: 5,
    unitCarryCapacity: 0,
    category: 'infantry',
    tribe: 'huns',
    tier: 'special',
    researchRequirements: [
      { buildingId: 'RALLY_POINT', level: 10 },
      { buildingId: 'ACADEMY', level: 20 },
    ],
  },
  {
    id: 'HUN_SETTLER',
    baseRecruitmentCost: [6100, 4600, 4800, 5400],
    baseRecruitmentDuration: 28950,
    unitWheatConsumption: 1,
    attack: 10,
    infantryDefence: 80,
    cavalryDefence: 80,
    unitSpeed: 5,
    unitCarryCapacity: 3000,
    category: 'infantry',
    tribe: 'huns',
    tier: 'special',
    researchRequirements: [],
  },
];

export const spartanUnits: Unit[] = [
  {
    id: 'HOPLITE',
    baseRecruitmentCost: [110, 185, 110, 40],
    baseRecruitmentDuration: 1700,
    unitWheatConsumption: 1,
    attack: 50,
    infantryDefence: 35,
    cavalryDefence: 30,
    unitSpeed: 6,
    unitCarryCapacity: 60,
    category: 'infantry',
    tribe: 'spartans',
    tier: 'tier-1',
    researchRequirements: [],
  },
  {
    id: 'SENTINEL',
    baseRecruitmentCost: [185, 150, 35, 75],
    baseRecruitmentDuration: 1232,
    unitWheatConsumption: 1,
    attack: 0,
    infantryDefence: 40,
    cavalryDefence: 22,
    unitSpeed: 9,
    unitCarryCapacity: 0,
    category: 'infantry',
    tribe: 'spartans',
    tier: 'scout',
    researchRequirements: [{ buildingId: 'ACADEMY', level: 1 }],
  },
  {
    id: 'SHIELDSMAN',
    baseRecruitmentCost: [145, 95, 245, 45],
    baseRecruitmentDuration: 1936,
    unitWheatConsumption: 1,
    attack: 40,
    infantryDefence: 85,
    cavalryDefence: 45,
    unitSpeed: 8,
    unitCarryCapacity: 40,
    category: 'infantry',
    tribe: 'spartans',
    tier: 'tier-2',
    researchRequirements: [{ buildingId: 'ACADEMY', level: 5 }],
  },
  {
    id: 'TWINSTEEL_THERION',
    baseRecruitmentCost: [130, 200, 400, 65],
    baseRecruitmentDuration: 2112,
    unitWheatConsumption: 1,
    attack: 90,
    infantryDefence: 55,
    cavalryDefence: 40,
    unitSpeed: 6,
    unitCarryCapacity: 50,
    category: 'infantry',
    tribe: 'spartans',
    tier: 'tier-3',
    researchRequirements: [{ buildingId: 'ACADEMY', level: 10 }],
  },
  {
    id: 'ELPIDA_RIDER',
    baseRecruitmentCost: [555, 445, 330, 110],
    baseRecruitmentDuration: 2816,
    unitWheatConsumption: 2,
    attack: 55,
    infantryDefence: 120,
    cavalryDefence: 90,
    unitSpeed: 16,
    unitCarryCapacity: 110,
    category: 'cavalry',
    tribe: 'spartans',
    tier: 'tier-4',
    researchRequirements: [
      { buildingId: 'STABLE', level: 1 },
      { buildingId: 'ACADEMY', level: 5 },
    ],
  },
  {
    id: 'CORINTHIAN_CRUSHER',
    baseRecruitmentCost: [660, 495, 995, 165],
    baseRecruitmentDuration: 3432,
    unitWheatConsumption: 3,
    attack: 195,
    infantryDefence: 80,
    cavalryDefence: 75,
    unitSpeed: 9,
    unitCarryCapacity: 80,
    category: 'cavalry',
    tribe: 'spartans',
    tier: 'tier-5',
    researchRequirements: [
      { buildingId: 'STABLE', level: 10 },
      { buildingId: 'ACADEMY', level: 5 },
    ],
  },
  {
    id: 'SPARTAN_RAM',
    baseRecruitmentCost: [525, 260, 790, 130],
    baseRecruitmentDuration: 4620,
    unitWheatConsumption: 3,
    attack: 65,
    infantryDefence: 30,
    cavalryDefence: 80,
    unitSpeed: 4,
    unitCarryCapacity: 0,
    category: 'siege',
    tribe: 'spartans',
    tier: 'siege-ram',
    researchRequirements: [
      { buildingId: 'WORKSHOP', level: 1 },
      { buildingId: 'ACADEMY', level: 10 },
    ],
  },
  {
    id: 'SPARTAN_CATAPULT',
    baseRecruitmentCost: [550, 1240, 825, 125],
    baseRecruitmentDuration: 0,
    unitWheatConsumption: 6,
    attack: 50,
    infantryDefence: 60,
    cavalryDefence: 10,
    unitSpeed: 3,
    unitCarryCapacity: 0,
    category: 'siege',
    tribe: 'spartans',
    tier: 'siege-catapult',
    researchRequirements: [
      { buildingId: 'WORKSHOP', level: 10 },
      { buildingId: 'ACADEMY', level: 15 },
    ],
  },
  {
    id: 'EPHOR',
    baseRecruitmentCost: [33450, 30665, 36240, 13935],
    baseRecruitmentDuration: 77550,
    unitWheatConsumption: 1,
    attack: 40,
    infantryDefence: 60,
    cavalryDefence: 40,
    unitSpeed: 4,
    unitCarryCapacity: 0,
    category: 'special',
    tribe: 'spartans',
    tier: 'special',
    researchRequirements: [
      { buildingId: 'RALLY_POINT', level: 10 },
      { buildingId: 'ACADEMY', level: 20 },
    ],
  },
  {
    id: 'SPARTAN_SETTLER',
    baseRecruitmentCost: [5115, 5580, 6045, 3255],
    baseRecruitmentDuration: 34100,
    unitWheatConsumption: 1,
    attack: 10,
    infantryDefence: 80,
    cavalryDefence: 80,
    unitSpeed: 5,
    unitCarryCapacity: 3000,
    category: 'special',
    tribe: 'spartans',
    tier: 'special',
    researchRequirements: [],
  },
];

// TODO: Think of cost and recruitment time for nature & natarian units
export const natureUnits: Unit[] = [
  {
    id: 'RAT',
    baseRecruitmentCost: [0, 0, 0, 0],
    baseRecruitmentDuration: 0,
    unitWheatConsumption: 1,
    attack: 10,
    infantryDefence: 25,
    cavalryDefence: 20,
    unitSpeed: 20,
    unitCarryCapacity: 0,
    category: 'infantry',
    tribe: 'nature',
    tier: 'tier-1',
    researchRequirements: [],
  },
  {
    id: 'SPIDER',
    baseRecruitmentCost: [0, 0, 0, 0],
    baseRecruitmentDuration: 0,
    unitWheatConsumption: 1,
    attack: 20,
    infantryDefence: 35,
    cavalryDefence: 40,
    unitSpeed: 20,
    unitCarryCapacity: 0,
    category: 'infantry',
    tribe: 'nature',
    tier: 'tier-2',
    researchRequirements: [],
  },
  {
    id: 'SERPENT',
    baseRecruitmentCost: [0, 0, 0, 0],
    baseRecruitmentDuration: 0,
    unitWheatConsumption: 1,
    attack: 60,
    infantryDefence: 40,
    cavalryDefence: 60,
    unitSpeed: 20,
    unitCarryCapacity: 0,
    category: 'infantry',
    tribe: 'nature',
    tier: 'tier-2',
    researchRequirements: [],
  },
  {
    id: 'BAT',
    baseRecruitmentCost: [0, 0, 0, 0],
    baseRecruitmentDuration: 0,
    unitWheatConsumption: 1,
    attack: 80,
    infantryDefence: 66,
    cavalryDefence: 50,
    unitSpeed: 20,
    unitCarryCapacity: 0,
    category: 'infantry',
    tribe: 'nature',
    tier: 'scout',
    researchRequirements: [],
  },
  {
    id: 'WILD_BOAR',
    baseRecruitmentCost: [0, 0, 0, 0],
    baseRecruitmentDuration: 0,
    unitWheatConsumption: 2,
    attack: 50,
    infantryDefence: 70,
    cavalryDefence: 33,
    unitSpeed: 20,
    unitCarryCapacity: 0,
    category: 'infantry',
    tribe: 'nature',
    tier: 'tier-3',
    researchRequirements: [],
  },
  {
    id: 'WOLF',
    baseRecruitmentCost: [0, 0, 0, 0],
    baseRecruitmentDuration: 0,
    unitWheatConsumption: 2,
    attack: 100,
    infantryDefence: 80,
    cavalryDefence: 70,
    unitSpeed: 20,
    unitCarryCapacity: 0,
    category: 'infantry',
    tribe: 'nature',
    tier: 'tier-4',
    researchRequirements: [],
  },
  {
    id: 'BEAR',
    baseRecruitmentCost: [0, 0, 0, 0],
    baseRecruitmentDuration: 0,
    unitWheatConsumption: 3,
    attack: 250,
    infantryDefence: 140,
    cavalryDefence: 200,
    unitSpeed: 20,
    unitCarryCapacity: 0,
    category: 'infantry',
    tribe: 'nature',
    tier: 'tier-4',
    researchRequirements: [],
  },
  {
    id: 'CROCODILE',
    baseRecruitmentCost: [0, 0, 0, 0],
    baseRecruitmentDuration: 0,
    unitWheatConsumption: 3,
    attack: 450,
    infantryDefence: 380,
    cavalryDefence: 240,
    unitSpeed: 20,
    unitCarryCapacity: 0,
    category: 'infantry',
    tribe: 'nature',
    tier: 'tier-5',
    researchRequirements: [],
  },
  {
    id: 'TIGER',
    baseRecruitmentCost: [0, 0, 0, 0],
    baseRecruitmentDuration: 0,
    unitWheatConsumption: 3,
    attack: 200,
    infantryDefence: 170,
    cavalryDefence: 250,
    unitSpeed: 20,
    unitCarryCapacity: 0,
    category: 'infantry',
    tribe: 'nature',
    tier: 'tier-5',
    researchRequirements: [],
  },
  {
    id: 'ELEPHANT',
    baseRecruitmentCost: [0, 0, 0, 0],
    baseRecruitmentDuration: 0,
    unitWheatConsumption: 5,
    attack: 600,
    infantryDefence: 440,
    cavalryDefence: 520,
    unitSpeed: 20,
    unitCarryCapacity: 0,
    category: 'infantry',
    tribe: 'nature',
    tier: 'tier-5',
    researchRequirements: [],
  },
];

export const natarianUnits: Unit[] = [
  {
    id: 'PIKEMAN',
    baseRecruitmentCost: [0, 0, 0, 0],
    baseRecruitmentDuration: 0,
    unitWheatConsumption: 1,
    attack: 20,
    infantryDefence: 35,
    cavalryDefence: 50,
    unitSpeed: 6,
    unitCarryCapacity: 0,
    category: 'infantry',
    tribe: 'natars',
    tier: 'tier-1',
    researchRequirements: [],
  },
  {
    id: 'THORNED_WARRIOR',
    baseRecruitmentCost: [0, 0, 0, 0],
    baseRecruitmentDuration: 0,
    unitWheatConsumption: 1,
    attack: 65,
    infantryDefence: 30,
    cavalryDefence: 10,
    unitSpeed: 7,
    unitCarryCapacity: 0,
    category: 'infantry',
    tribe: 'natars',
    tier: 'tier-2',
    researchRequirements: [{ buildingId: 'ACADEMY', level: 3 }],
  },
  {
    id: 'GUARDSMAN',
    baseRecruitmentCost: [0, 0, 0, 0],
    baseRecruitmentDuration: 0,
    unitWheatConsumption: 1,
    attack: 100,
    infantryDefence: 90,
    cavalryDefence: 75,
    unitSpeed: 6,
    unitCarryCapacity: 0,
    category: 'infantry',
    tribe: 'natars',
    tier: 'tier-3',
    researchRequirements: [{ buildingId: 'ACADEMY', level: 5 }],
  },
  {
    id: 'BIRDS_OF_PREY',
    baseRecruitmentCost: [0, 0, 0, 0],
    baseRecruitmentDuration: 0,
    unitWheatConsumption: 1,
    attack: 0,
    infantryDefence: 10,
    cavalryDefence: 10,
    unitSpeed: 25,
    unitCarryCapacity: 0,
    category: 'cavalry',
    tribe: 'natars',
    tier: 'scout',
    researchRequirements: [
      { buildingId: 'ACADEMY', level: 5 },
      { buildingId: 'STABLE', level: 1 },
    ],
  },
  {
    id: 'AXERIDER',
    baseRecruitmentCost: [0, 0, 0, 0],
    baseRecruitmentDuration: 0,
    unitWheatConsumption: 2,
    attack: 155,
    infantryDefence: 80,
    cavalryDefence: 50,
    unitSpeed: 14,
    unitCarryCapacity: 0,
    category: 'cavalry',
    tribe: 'natars',
    tier: 'tier-4',
    researchRequirements: [
      { buildingId: 'ACADEMY', level: 5 },
      { buildingId: 'STABLE', level: 1 },
    ],
  },
  {
    id: 'NATARIAN_KNIGHT',
    baseRecruitmentCost: [0, 0, 0, 0],
    baseRecruitmentDuration: 0,
    unitWheatConsumption: 3,
    attack: 170,
    infantryDefence: 140,
    cavalryDefence: 80,
    unitSpeed: 12,
    unitCarryCapacity: 0,
    category: 'cavalry',
    tribe: 'natars',
    tier: 'tier-5',
    researchRequirements: [
      { buildingId: 'ACADEMY', level: 15 },
      { buildingId: 'STABLE', level: 10 },
    ],
  },
  {
    id: 'NATARIAN_RAM',
    baseRecruitmentCost: [0, 0, 0, 0],
    baseRecruitmentDuration: 0,
    unitWheatConsumption: 4,
    attack: 250,
    infantryDefence: 120,
    cavalryDefence: 150,
    unitSpeed: 5,
    unitCarryCapacity: 0,
    category: 'siege',
    tribe: 'natars',
    tier: 'siege-ram',
    researchRequirements: [
      { buildingId: 'ACADEMY', level: 10 },
      { buildingId: 'WORKSHOP', level: 1 },
    ],
  },
  {
    id: 'NATARIAN_CATAPULT',
    baseRecruitmentCost: [0, 0, 0, 0],
    baseRecruitmentDuration: 0,
    unitWheatConsumption: 5,
    attack: 60,
    infantryDefence: 45,
    cavalryDefence: 10,
    unitSpeed: 3,
    unitCarryCapacity: 0,
    category: 'siege',
    tribe: 'natars',
    tier: 'siege-catapult',
    researchRequirements: [
      { buildingId: 'ACADEMY', level: 15 },
      { buildingId: 'WORKSHOP', level: 10 },
    ],
  },
  {
    id: 'NATARIAN_EMPEROR',
    baseRecruitmentCost: [0, 0, 0, 0],
    baseRecruitmentDuration: 0,
    unitWheatConsumption: 1,
    attack: 80,
    infantryDefence: 50,
    cavalryDefence: 50,
    unitSpeed: 5,
    unitCarryCapacity: 0,
    category: 'special',
    tribe: 'natars',
    tier: 'special',
    researchRequirements: [
      { buildingId: 'RALLY_POINT', level: 10 },
      { buildingId: 'ACADEMY', level: 20 },
    ],
  },
  {
    id: 'NATARIAN_SETTLER',
    baseRecruitmentCost: [0, 0, 0, 0],
    baseRecruitmentDuration: 0,
    unitWheatConsumption: 1,
    attack: 30,
    infantryDefence: 40,
    cavalryDefence: 40,
    unitSpeed: 5,
    unitCarryCapacity: 3000,
    category: 'special',
    tribe: 'natars',
    tier: 'special',
    researchRequirements: [],
  },
];

export const units: Unit[] = [
  ...romanUnits,
  ...gaulUnits,
  ...teutonUnits,
  ...egyptianUnits,
  ...hunUnits,
  ...spartanUnits,
  ...natureUnits,
  ...natarianUnits,
];

// Use this for faster lookups
export const unitsMap = new Map<Unit['id'], Unit>(units.map((unit) => [unit.id, unit]));
