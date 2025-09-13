import type { HeroItem } from 'app/interfaces/models/game/hero';

// All artifacts begin with the 100_ prefix
const artifacts: HeroItem[] = [
  {
    id: 100_1,
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
    id: 100_2,
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
    id: 100_3,
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
    id: 100_4,
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
    id: 100_5,
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
    id: 100_6,
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
    id: 100_7,
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
    id: 100_8,
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
    id: 100_9,
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
    id: 100_10,
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
    id: 100_11,
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
    id: 100_12,
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
    id: 100_13,
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
    id: 100_14,
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
    id: 100_15,
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
    id: 100_16,
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
    id: 100_17,
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
    id: 100_18,
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
    id: 100_19,
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
    id: 100_20,
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
    id: 100_21,
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
    id: 100_22,
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
    id: 101_1,
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
    id: 101_2,
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
    id: 101_3,
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
    id: 101_4,
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
    id: 102_1,
    name: 'HEALING_POTION',
    slot: 'consumable',
    rarity: 'common',
    category: 'consumable',
    basePrice: 5,
  },
  {
    id: 102_2,
    name: 'BOOK_OF_WISDOM',
    slot: 'consumable',
    rarity: 'common',
    category: 'consumable',
    basePrice: 100,
  },
  {
    id: 102_3,
    name: 'ANIMAL_CAGE',
    slot: 'consumable',
    rarity: 'common',
    category: 'consumable',
    basePrice: 20,
  },
  {
    id: 102_4,
    name: 'REVIVAL_POTION',
    slot: 'consumable',
    rarity: 'common',
    category: 'consumable',
    basePrice: 20,
  },
  {
    id: 102_5,
    name: 'SILVER',
    slot: 'consumable',
    rarity: 'common',
    category: 'currency',
    basePrice: null,
  },
  {
    id: 102_6,
    name: 'WOOD',
    slot: 'consumable',
    rarity: 'common',
    category: 'resource',
    basePrice: null,
  },
  {
    id: 102_7,
    name: 'CLAY',
    slot: 'consumable',
    rarity: 'common',
    category: 'resource',
    basePrice: null,
  },
  {
    id: 102_8,
    name: 'IRON',
    slot: 'consumable',
    rarity: 'common',
    category: 'resource',
    basePrice: null,
  },
  {
    id: 102_9,
    name: 'WHEAT',
    slot: 'consumable',
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
