import type { HeroItem } from '@pillage-first/types/models/hero-item';

// All artifacts begin with the 100_ prefix
export const artifacts: HeroItem[] = [
  {
    id: 1001,
    name: 'UNCOMMON_ARTIFACT_MILITARY_TROOP_TRAVEL_SPEED',
    slot: 'non-equipable',
    rarity: 'uncommon',
    category: 'artifact',
    basePrice: null,
    effects: [
      {
        id: 'unitSpeed',
        value: 0.9,
        scope: 'village',
        source: 'artifact',
        type: 'bonus',
      },
    ],
  },
  {
    id: 1002,
    name: 'UNCOMMON_ARTIFACT_MILITARY_TROOP_CARRYING_CAPACITY',
    slot: 'non-equipable',
    rarity: 'uncommon',
    category: 'artifact',
    basePrice: null,
    effects: [
      {
        id: 'unitCarryCapacity',
        value: 1.1,
        scope: 'village',
        source: 'artifact',
        type: 'bonus',
      },
    ],
  },
  {
    id: 1003,
    name: 'UNCOMMON_ARTIFACT_MILITARY_TROOP_TRAINING_REDUCTION',
    slot: 'non-equipable',
    rarity: 'uncommon',
    category: 'artifact',
    basePrice: null,
    effects: [
      {
        id: 'barracksTrainingDuration',
        value: 0.9,
        scope: 'village',
        source: 'artifact',
        type: 'bonus',
      },
      {
        id: 'greatBarracksTrainingDuration',
        value: 0.9,
        scope: 'village',
        source: 'artifact',
        type: 'bonus',
      },
      {
        id: 'stableTrainingDuration',
        value: 0.9,
        scope: 'village',
        source: 'artifact',
        type: 'bonus',
      },
      {
        id: 'greatStableTrainingDuration',
        value: 0.9,
        scope: 'village',
        source: 'artifact',
        type: 'bonus',
      },
      {
        id: 'workshopTrainingDuration',
        value: 0.9,
        scope: 'village',
        source: 'artifact',
        type: 'bonus',
      },
      {
        id: 'hospitalTrainingDuration',
        value: 0.9,
        scope: 'village',
        source: 'artifact',
        type: 'bonus',
      },
    ],
  },
  {
    id: 1004,
    name: 'UNCOMMON_ARTIFACT_MILITARY_TROOP_WHEAT_CONSUMPTION_REDUCTION',
    slot: 'non-equipable',
    rarity: 'uncommon',
    category: 'artifact',
    basePrice: null,
    effects: [
      {
        id: 'unitWheatConsumption',
        value: 0.9,
        scope: 'village',
        source: 'artifact',
        type: 'bonus',
      },
    ],
  },
  {
    id: 1005,
    name: 'UNCOMMON_ARTIFACT_CIVIL_BUILD_TIME_REDUCTION',
    slot: 'non-equipable',
    rarity: 'uncommon',
    category: 'artifact',
    basePrice: null,
    effects: [
      {
        id: 'buildingDuration',
        value: 0.9,
        scope: 'village',
        source: 'artifact',
        type: 'bonus',
      },
    ],
  },
  {
    id: 1006,
    name: 'UNCOMMON_ARTIFACT_CIVIL_OASIS_PRODUCTION_BONUS',
    slot: 'non-equipable',
    rarity: 'uncommon',
    category: 'artifact',
    basePrice: null,
    // TODO: Figure out how to implement this. It should only target oasis bonuses. Or think of another artifact effect
    effects: [
      // {
      //   id: '',
      //   value: 0,
      //   scope: 'global',
      //   source: 'artifact',
      // }
    ],
  },
  {
    id: 1007,
    name: 'UNCOMMON_ARTIFACT_CIVIL_RESOURCE_PRODUCTION_BONUS',
    slot: 'non-equipable',
    rarity: 'uncommon',
    category: 'artifact',
    basePrice: null,
    effects: [
      {
        id: 'woodProduction',
        value: 1.1,
        scope: 'village',
        source: 'artifact',
        type: 'bonus',
      },
      {
        id: 'clayProduction',
        value: 1.1,
        scope: 'village',
        source: 'artifact',
        type: 'bonus',
      },
      {
        id: 'ironProduction',
        value: 1.1,
        scope: 'village',
        source: 'artifact',
        type: 'bonus',
      },
      {
        id: 'wheatProduction',
        value: 1.1,
        scope: 'village',
        source: 'artifact',
        type: 'bonus',
      },
    ],
  },
  // Rare
  {
    id: 1008,
    name: 'RARE_ARTIFACT_MILITARY_TROOP_TRAVEL_SPEED',
    slot: 'non-equipable',
    rarity: 'rare',
    category: 'artifact',
    basePrice: null,
    effects: [
      {
        id: 'unitSpeed',
        value: 0.5,
        scope: 'village',
        source: 'artifact',
        type: 'bonus',
      },
    ],
  },
  {
    id: 1009,
    name: 'RARE_ARTIFACT_MILITARY_TROOP_CARRYING_CAPACITY',
    slot: 'non-equipable',
    rarity: 'rare',
    category: 'artifact',
    basePrice: null,
    effects: [
      {
        id: 'unitCarryCapacity',
        value: 1.5,
        scope: 'village',
        source: 'artifact',
        type: 'bonus',
      },
    ],
  },
  {
    id: 10_010,
    name: 'RARE_ARTIFACT_MILITARY_TROOP_TRAINING_REDUCTION',
    slot: 'non-equipable',
    rarity: 'rare',
    category: 'artifact',
    basePrice: null,
    effects: [
      {
        id: 'barracksTrainingDuration',
        value: 0.5,
        scope: 'village',
        source: 'artifact',
        type: 'bonus',
      },
      {
        id: 'greatBarracksTrainingDuration',
        value: 0.5,
        scope: 'village',
        source: 'artifact',
        type: 'bonus',
      },
      {
        id: 'stableTrainingDuration',
        value: 0.5,
        scope: 'village',
        source: 'artifact',
        type: 'bonus',
      },
      {
        id: 'greatStableTrainingDuration',
        value: 0.5,
        scope: 'village',
        source: 'artifact',
        type: 'bonus',
      },
      {
        id: 'workshopTrainingDuration',
        value: 0.5,
        scope: 'village',
        source: 'artifact',
        type: 'bonus',
      },
      {
        id: 'hospitalTrainingDuration',
        value: 0.5,
        scope: 'village',
        source: 'artifact',
        type: 'bonus',
      },
    ],
  },
  {
    id: 10_011,
    name: 'RARE_ARTIFACT_MILITARY_TROOP_WHEAT_CONSUMPTION_REDUCTION',
    slot: 'non-equipable',
    rarity: 'rare',
    category: 'artifact',
    basePrice: null,
    effects: [
      {
        id: 'unitWheatConsumption',
        value: 0.5,
        scope: 'village',
        source: 'artifact',
        type: 'bonus',
      },
    ],
  },
  {
    id: 10_012,
    name: 'RARE_ARTIFACT_CIVIL_BUILD_TIME_REDUCTION',
    slot: 'non-equipable',
    rarity: 'rare',
    category: 'artifact',
    basePrice: null,
    effects: [
      {
        id: 'buildingDuration',
        value: 0.5,
        scope: 'village',
        source: 'artifact',
        type: 'bonus',
      },
    ],
  },
  {
    id: 10_013,
    name: 'RARE_ARTIFACT_CIVIL_OASIS_PRODUCTION_BONUS',
    slot: 'non-equipable',
    rarity: 'rare',
    category: 'artifact',
    basePrice: null,
    // TODO: Figure out how to implement this. It should only target oasis bonuses. Or think of another artifact effect
    effects: [
      // {
      //   id: '',
      //   value: 0,
      //   scope: 'global',
      //   source: 'artifact',
      // }
    ],
  },
  {
    id: 10_014,
    name: 'RARE_ARTIFACT_CIVIL_RESOURCE_PRODUCTION_BONUS',
    slot: 'non-equipable',
    rarity: 'rare',
    category: 'artifact',
    basePrice: null,
    effects: [
      {
        id: 'woodProduction',
        value: 1.5,
        scope: 'village',
        source: 'artifact',
        type: 'bonus',
      },
      {
        id: 'clayProduction',
        value: 1.5,
        scope: 'village',
        source: 'artifact',
        type: 'bonus',
      },
      {
        id: 'ironProduction',
        value: 1.5,
        scope: 'village',
        source: 'artifact',
        type: 'bonus',
      },
      {
        id: 'wheatProduction',
        value: 1.5,
        scope: 'village',
        source: 'artifact',
        type: 'bonus',
      },
    ],
  },
  // Epic
  {
    id: 10_015,
    name: 'EPIC_ARTIFACT_MILITARY_TROOP_TRAVEL_SPEED',
    slot: 'non-equipable',
    rarity: 'epic',
    category: 'artifact',
    basePrice: null,
    effects: [
      {
        id: 'unitSpeed',
        value: 0.5,
        scope: 'global',
        source: 'artifact',
        type: 'bonus',
      },
    ],
  },
  {
    id: 10_016,
    name: 'EPIC_ARTIFACT_MILITARY_TROOP_CARRYING_CAPACITY',
    slot: 'non-equipable',
    rarity: 'epic',
    category: 'artifact',
    basePrice: null,
    effects: [
      {
        id: 'unitCarryCapacity',
        value: 1.5,
        scope: 'global',
        source: 'artifact',
        type: 'bonus',
      },
    ],
  },
  {
    id: 10_017,
    name: 'EPIC_ARTIFACT_MILITARY_TROOP_TRAINING_REDUCTION',
    slot: 'non-equipable',
    rarity: 'epic',
    category: 'artifact',
    basePrice: null,
    effects: [
      {
        id: 'barracksTrainingDuration',
        value: 0.5,
        scope: 'global',
        source: 'artifact',
        type: 'bonus',
      },
      {
        id: 'greatBarracksTrainingDuration',
        value: 0.5,
        scope: 'global',
        source: 'artifact',
        type: 'bonus',
      },
      {
        id: 'stableTrainingDuration',
        value: 0.5,
        scope: 'global',
        source: 'artifact',
        type: 'bonus',
      },
      {
        id: 'greatStableTrainingDuration',
        value: 0.5,
        scope: 'global',
        source: 'artifact',
        type: 'bonus',
      },
      {
        id: 'workshopTrainingDuration',
        value: 0.5,
        scope: 'global',
        source: 'artifact',
        type: 'bonus',
      },
      {
        id: 'hospitalTrainingDuration',
        value: 0.5,
        scope: 'global',
        source: 'artifact',
        type: 'bonus',
      },
    ],
  },
  {
    id: 10_018,
    name: 'EPIC_ARTIFACT_MILITARY_TROOP_WHEAT_CONSUMPTION_REDUCTION',
    slot: 'non-equipable',
    rarity: 'epic',
    category: 'artifact',
    basePrice: null,
    effects: [
      {
        id: 'unitWheatConsumption',
        value: 0.5,
        scope: 'global',
        source: 'artifact',
        type: 'bonus',
      },
    ],
  },
  {
    id: 10_019,
    name: 'EPIC_ARTIFACT_CIVIL_BUILD_TIME_REDUCTION',
    slot: 'non-equipable',
    rarity: 'epic',
    category: 'artifact',
    basePrice: null,
    effects: [
      {
        id: 'buildingDuration',
        value: 0.5,
        scope: 'global',
        source: 'artifact',
        type: 'bonus',
      },
    ],
  },
  {
    id: 10_020,
    name: 'EPIC_ARTIFACT_CIVIL_OASIS_PRODUCTION_BONUS',
    slot: 'non-equipable',
    rarity: 'epic',
    category: 'artifact',
    basePrice: null,
    // TODO: Figure out how to implement this. It should only target oasis bonuses. Or think of another artifact effect
    effects: [
      // {
      //   id: '',
      //   value: 0,
      //   scope: 'global',
      //   source: 'artifact',
      // }
    ],
  },
  {
    id: 10_021,
    name: 'EPIC_ARTIFACT_CIVIL_RESOURCE_PRODUCTION_BONUS',
    slot: 'non-equipable',
    rarity: 'epic',
    category: 'artifact',
    basePrice: null,
    effects: [
      {
        id: 'woodProduction',
        value: 1.5,
        scope: 'global',
        source: 'artifact',
        type: 'bonus',
      },
      {
        id: 'clayProduction',
        value: 1.5,
        scope: 'global',
        source: 'artifact',
        type: 'bonus',
      },
      {
        id: 'ironProduction',
        value: 1.5,
        scope: 'global',
        source: 'artifact',
        type: 'bonus',
      },
      {
        id: 'wheatProduction',
        value: 1.5,
        scope: 'global',
        source: 'artifact',
        type: 'bonus',
      },
    ],
  },
  {
    id: 10_022,
    name: 'EPIC_ARTIFACT_CIVIL_ENABLE_GREAT_BUILDINGS',
    slot: 'non-equipable',
    rarity: 'epic',
    category: 'artifact',
    basePrice: null,
    effects: [],
  },
];

// All horses begin with the 101_ prefix
const horses: HeroItem[] = [
  {
    id: 1011,
    name: 'COMMON_HORSE',
    slot: 'horse',
    rarity: 'common',
    category: 'wearable',
    basePrice: 5,
    heroBonus: [
      {
        attribute: 'speed',
        value: 7,
      },
    ],
  },
  {
    id: 1012,
    name: 'UNCOMMON_HORSE',
    slot: 'horse',
    rarity: 'uncommon',
    category: 'wearable',
    basePrice: 5,
    heroBonus: [
      {
        attribute: 'speed',
        value: 9,
      },
    ],
  },
  {
    id: 1013,
    name: 'RARE_HORSE',
    slot: 'horse',
    rarity: 'rare',
    category: 'wearable',
    basePrice: 5,
    heroBonus: [
      {
        attribute: 'speed',
        value: 11,
      },
    ],
  },
  {
    id: 1014,
    name: 'EPIC_HORSE',
    slot: 'horse',
    rarity: 'epic',
    category: 'wearable',
    basePrice: 5,
    heroBonus: [
      {
        attribute: 'speed',
        value: 13,
      },
    ],
  },
];

// All consumables begin with the 102_ prefix
const consumables: HeroItem[] = [
  {
    id: 1021,
    name: 'HEALING_POTION',
    slot: 'non-equipable',
    rarity: 'common',
    category: 'consumable',
    basePrice: 5,
  },
  {
    id: 1022,
    name: 'BOOK_OF_WISDOM',
    slot: 'non-equipable',
    rarity: 'common',
    category: 'consumable',
    basePrice: 100,
  },
  {
    id: 1023,
    name: 'ANIMAL_CAGE',
    slot: 'consumable',
    rarity: 'common',
    category: 'consumable',
    basePrice: 20,
  },
  {
    id: 1024,
    name: 'REVIVAL_POTION',
    slot: 'non-equipable',
    rarity: 'common',
    category: 'consumable',
    basePrice: 20,
  },
  {
    id: 1025,
    name: 'SILVER',
    slot: 'non-equipable',
    rarity: 'common',
    category: 'currency',
    basePrice: null,
  },
  {
    id: 1026,
    name: 'WOOD',
    slot: 'non-equipable',
    rarity: 'common',
    category: 'resource',
    basePrice: null,
  },
  {
    id: 1027,
    name: 'CLAY',
    slot: 'non-equipable',
    rarity: 'common',
    category: 'resource',
    basePrice: null,
  },
  {
    id: 1028,
    name: 'IRON',
    slot: 'non-equipable',
    rarity: 'common',
    category: 'resource',
    basePrice: null,
  },
  {
    id: 1029,
    name: 'WHEAT',
    slot: 'non-equipable',
    rarity: 'common',
    category: 'resource',
    basePrice: null,
  },
];

export const items: HeroItem[] = [...artifacts, ...horses, ...consumables];

// Use this for faster lookups
export const itemsMap = new Map<HeroItem['id'], HeroItem>(
  items.map((heroItem) => [heroItem.id, heroItem]),
);
