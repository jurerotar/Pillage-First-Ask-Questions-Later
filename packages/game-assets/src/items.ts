import type {
  HeroEquipmentItem,
  HeroItem,
} from '@pillage-first/types/models/hero-item';

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
        scope: 'local',
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
        scope: 'local',
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
        scope: 'local',
        source: 'artifact',
        type: 'bonus',
      },
      {
        id: 'greatBarracksTrainingDuration',
        value: 0.9,
        scope: 'local',
        source: 'artifact',
        type: 'bonus',
      },
      {
        id: 'stableTrainingDuration',
        value: 0.9,
        scope: 'local',
        source: 'artifact',
        type: 'bonus',
      },
      {
        id: 'greatStableTrainingDuration',
        value: 0.9,
        scope: 'local',
        source: 'artifact',
        type: 'bonus',
      },
      {
        id: 'workshopTrainingDuration',
        value: 0.9,
        scope: 'local',
        source: 'artifact',
        type: 'bonus',
      },
      {
        id: 'hospitalTrainingDuration',
        value: 0.9,
        scope: 'local',
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
        scope: 'local',
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
        scope: 'local',
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
        scope: 'local',
        source: 'artifact',
        type: 'bonus',
      },
      {
        id: 'clayProduction',
        value: 1.1,
        scope: 'local',
        source: 'artifact',
        type: 'bonus',
      },
      {
        id: 'ironProduction',
        value: 1.1,
        scope: 'local',
        source: 'artifact',
        type: 'bonus',
      },
      {
        id: 'wheatProduction',
        value: 1.1,
        scope: 'local',
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
        scope: 'local',
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
        scope: 'local',
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
        scope: 'local',
        source: 'artifact',
        type: 'bonus',
      },
      {
        id: 'greatBarracksTrainingDuration',
        value: 0.5,
        scope: 'local',
        source: 'artifact',
        type: 'bonus',
      },
      {
        id: 'stableTrainingDuration',
        value: 0.5,
        scope: 'local',
        source: 'artifact',
        type: 'bonus',
      },
      {
        id: 'greatStableTrainingDuration',
        value: 0.5,
        scope: 'local',
        source: 'artifact',
        type: 'bonus',
      },
      {
        id: 'workshopTrainingDuration',
        value: 0.5,
        scope: 'local',
        source: 'artifact',
        type: 'bonus',
      },
      {
        id: 'hospitalTrainingDuration',
        value: 0.5,
        scope: 'local',
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
        scope: 'local',
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
        scope: 'local',
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
        scope: 'local',
        source: 'artifact',
        type: 'bonus',
      },
      {
        id: 'clayProduction',
        value: 1.5,
        scope: 'local',
        source: 'artifact',
        type: 'bonus',
      },
      {
        id: 'ironProduction',
        value: 1.5,
        scope: 'local',
        source: 'artifact',
        type: 'bonus',
      },
      {
        id: 'wheatProduction',
        value: 1.5,
        scope: 'local',
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
  {
    id: 1030,
    name: 'EXPERIENCE_SCROLL',
    slot: 'non-equipable',
    rarity: 'common',
    category: 'consumable',
    basePrice: 50,
  },
];

// All boots begin with the 104_ prefix
const boots: HeroEquipmentItem[] = [
  {
    id: 104001,
    name: 'COMMON_LEATHER_BOOTS_OF_WOOD',
    slot: 'boots',
    rarity: 'common',
    category: 'wearable',
    basePrice: 500,
    effects: [
      {
        id: 'woodProduction',
        value: 50,
        scope: 'local',
        source: 'hero',
        type: 'base',
      },
    ],
    heroBonus: [
      {
        attribute: 'damageReduction',
        value: 2,
      },
    ],
  },
  {
    id: 104002,
    name: 'COMMON_LEATHER_BOOTS_OF_CLAY',
    slot: 'boots',
    rarity: 'common',
    category: 'wearable',
    basePrice: 500,
    effects: [
      {
        id: 'clayProduction',
        value: 50,
        scope: 'local',
        source: 'hero',
        type: 'base',
      },
    ],
    heroBonus: [
      {
        attribute: 'damageReduction',
        value: 2,
      },
    ],
  },
  {
    id: 104003,
    name: 'COMMON_LEATHER_BOOTS_OF_IRON',
    slot: 'boots',
    rarity: 'common',
    category: 'wearable',
    basePrice: 500,
    effects: [
      {
        id: 'ironProduction',
        value: 50,
        scope: 'local',
        source: 'hero',
        type: 'base',
      },
    ],
    heroBonus: [
      {
        attribute: 'damageReduction',
        value: 2,
      },
    ],
  },
  {
    id: 104004,
    name: 'COMMON_LEATHER_BOOTS_OF_CROP',
    slot: 'boots',
    rarity: 'common',
    category: 'wearable',
    basePrice: 500,
    effects: [
      {
        id: 'wheatProduction',
        value: 50,
        scope: 'local',
        source: 'hero',
        type: 'base',
      },
    ],
    heroBonus: [
      {
        attribute: 'damageReduction',
        value: 2,
      },
    ],
  },
  {
    id: 104005,
    name: 'COMMON_LEATHER_BOOTS_OF_WOOD_PRODUCTION',
    slot: 'boots',
    rarity: 'common',
    category: 'wearable',
    basePrice: 500,
    effects: [
      {
        id: 'woodProduction',
        value: 1.025,
        scope: 'local',
        source: 'hero',
        type: 'bonus',
      },
    ],
    heroBonus: [
      {
        attribute: 'damageReduction',
        value: 2,
      },
    ],
  },
  {
    id: 104006,
    name: 'COMMON_LEATHER_BOOTS_OF_CLAY_PRODUCTION',
    slot: 'boots',
    rarity: 'common',
    category: 'wearable',
    basePrice: 500,
    effects: [
      {
        id: 'clayProduction',
        value: 1.025,
        scope: 'local',
        source: 'hero',
        type: 'bonus',
      },
    ],
    heroBonus: [
      {
        attribute: 'damageReduction',
        value: 2,
      },
    ],
  },
  {
    id: 104007,
    name: 'COMMON_LEATHER_BOOTS_OF_IRON_PRODUCTION',
    slot: 'boots',
    rarity: 'common',
    category: 'wearable',
    basePrice: 500,
    effects: [
      {
        id: 'ironProduction',
        value: 1.025,
        scope: 'local',
        source: 'hero',
        type: 'bonus',
      },
    ],
    heroBonus: [
      {
        attribute: 'damageReduction',
        value: 2,
      },
    ],
  },
  {
    id: 104008,
    name: 'COMMON_LEATHER_BOOTS_OF_CROP_PRODUCTION',
    slot: 'boots',
    rarity: 'common',
    category: 'wearable',
    basePrice: 500,
    effects: [
      {
        id: 'wheatProduction',
        value: 1.025,
        scope: 'local',
        source: 'hero',
        type: 'bonus',
      },
    ],
    heroBonus: [
      {
        attribute: 'damageReduction',
        value: 2,
      },
    ],
  },
  {
    id: 104009,
    name: 'COMMON_LEATHER_BOOTS_OF_STRENGTH',
    slot: 'boots',
    rarity: 'common',
    category: 'wearable',
    basePrice: 500,
    heroBonus: [
      {
        attribute: 'power',
        value: 100,
      },
      {
        attribute: 'damageReduction',
        value: 2,
      },
    ],
  },
  {
    id: 104010,
    name: 'COMMON_LEATHER_BOOTS_OF_PROTECTION',
    slot: 'boots',
    rarity: 'common',
    category: 'wearable',
    basePrice: 500,
    heroBonus: [
      {
        attribute: 'damageReduction',
        value: 3,
      },
    ],
  },
  {
    id: 104011,
    name: 'COMMON_MAIL_BOOTS_OF_WOOD',
    slot: 'boots',
    rarity: 'common',
    category: 'wearable',
    basePrice: 500,
    effects: [
      {
        id: 'woodProduction',
        value: 50,
        scope: 'local',
        source: 'hero',
        type: 'base',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 75,
      },
      {
        attribute: 'damageReduction',
        value: 1,
      },
    ],
  },
  {
    id: 104012,
    name: 'COMMON_MAIL_BOOTS_OF_CLAY',
    slot: 'boots',
    rarity: 'common',
    category: 'wearable',
    basePrice: 500,
    effects: [
      {
        id: 'clayProduction',
        value: 50,
        scope: 'local',
        source: 'hero',
        type: 'base',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 75,
      },
      {
        attribute: 'damageReduction',
        value: 1,
      },
    ],
  },
  {
    id: 104013,
    name: 'COMMON_MAIL_BOOTS_OF_IRON',
    slot: 'boots',
    rarity: 'common',
    category: 'wearable',
    basePrice: 500,
    effects: [
      {
        id: 'ironProduction',
        value: 50,
        scope: 'local',
        source: 'hero',
        type: 'base',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 75,
      },
      {
        attribute: 'damageReduction',
        value: 1,
      },
    ],
  },
  {
    id: 104014,
    name: 'COMMON_MAIL_BOOTS_OF_CROP',
    slot: 'boots',
    rarity: 'common',
    category: 'wearable',
    basePrice: 500,
    effects: [
      {
        id: 'wheatProduction',
        value: 50,
        scope: 'local',
        source: 'hero',
        type: 'base',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 75,
      },
      {
        attribute: 'damageReduction',
        value: 1,
      },
    ],
  },
  {
    id: 104015,
    name: 'COMMON_MAIL_BOOTS_OF_WOOD_PRODUCTION',
    slot: 'boots',
    rarity: 'common',
    category: 'wearable',
    basePrice: 500,
    effects: [
      {
        id: 'woodProduction',
        value: 1.025,
        scope: 'local',
        source: 'hero',
        type: 'bonus',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 75,
      },
      {
        attribute: 'damageReduction',
        value: 1,
      },
    ],
  },
  {
    id: 104016,
    name: 'COMMON_MAIL_BOOTS_OF_CLAY_PRODUCTION',
    slot: 'boots',
    rarity: 'common',
    category: 'wearable',
    basePrice: 500,
    effects: [
      {
        id: 'clayProduction',
        value: 1.025,
        scope: 'local',
        source: 'hero',
        type: 'bonus',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 75,
      },
      {
        attribute: 'damageReduction',
        value: 1,
      },
    ],
  },
  {
    id: 104017,
    name: 'COMMON_MAIL_BOOTS_OF_IRON_PRODUCTION',
    slot: 'boots',
    rarity: 'common',
    category: 'wearable',
    basePrice: 500,
    effects: [
      {
        id: 'ironProduction',
        value: 1.025,
        scope: 'local',
        source: 'hero',
        type: 'bonus',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 75,
      },
      {
        attribute: 'damageReduction',
        value: 1,
      },
    ],
  },
  {
    id: 104018,
    name: 'COMMON_MAIL_BOOTS_OF_CROP_PRODUCTION',
    slot: 'boots',
    rarity: 'common',
    category: 'wearable',
    basePrice: 500,
    effects: [
      {
        id: 'wheatProduction',
        value: 1.025,
        scope: 'local',
        source: 'hero',
        type: 'bonus',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 75,
      },
      {
        attribute: 'damageReduction',
        value: 1,
      },
    ],
  },
  {
    id: 104019,
    name: 'COMMON_MAIL_BOOTS_OF_STRENGTH',
    slot: 'boots',
    rarity: 'common',
    category: 'wearable',
    basePrice: 500,
    heroBonus: [
      {
        attribute: 'power',
        value: 175,
      },
      {
        attribute: 'damageReduction',
        value: 1,
      },
    ],
  },
  {
    id: 104020,
    name: 'COMMON_MAIL_BOOTS_OF_PROTECTION',
    slot: 'boots',
    rarity: 'common',
    category: 'wearable',
    basePrice: 500,
    heroBonus: [
      {
        attribute: 'power',
        value: 75,
      },
      {
        attribute: 'damageReduction',
        value: 2,
      },
    ],
  },
  {
    id: 104021,
    name: 'COMMON_PLATE_BOOTS_OF_WOOD',
    slot: 'boots',
    rarity: 'common',
    category: 'wearable',
    basePrice: 500,
    effects: [
      {
        id: 'woodProduction',
        value: 50,
        scope: 'local',
        source: 'hero',
        type: 'base',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 150,
      },
    ],
  },
  {
    id: 104022,
    name: 'COMMON_PLATE_BOOTS_OF_CLAY',
    slot: 'boots',
    rarity: 'common',
    category: 'wearable',
    basePrice: 500,
    effects: [
      {
        id: 'clayProduction',
        value: 50,
        scope: 'local',
        source: 'hero',
        type: 'base',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 150,
      },
    ],
  },
  {
    id: 104023,
    name: 'COMMON_PLATE_BOOTS_OF_IRON',
    slot: 'boots',
    rarity: 'common',
    category: 'wearable',
    basePrice: 500,
    effects: [
      {
        id: 'ironProduction',
        value: 50,
        scope: 'local',
        source: 'hero',
        type: 'base',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 150,
      },
    ],
  },
  {
    id: 104024,
    name: 'COMMON_PLATE_BOOTS_OF_CROP',
    slot: 'boots',
    rarity: 'common',
    category: 'wearable',
    basePrice: 500,
    effects: [
      {
        id: 'wheatProduction',
        value: 50,
        scope: 'local',
        source: 'hero',
        type: 'base',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 150,
      },
    ],
  },
  {
    id: 104025,
    name: 'COMMON_PLATE_BOOTS_OF_WOOD_PRODUCTION',
    slot: 'boots',
    rarity: 'common',
    category: 'wearable',
    basePrice: 500,
    effects: [
      {
        id: 'woodProduction',
        value: 1.025,
        scope: 'local',
        source: 'hero',
        type: 'bonus',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 150,
      },
    ],
  },
  {
    id: 104026,
    name: 'COMMON_PLATE_BOOTS_OF_CLAY_PRODUCTION',
    slot: 'boots',
    rarity: 'common',
    category: 'wearable',
    basePrice: 500,
    effects: [
      {
        id: 'clayProduction',
        value: 1.025,
        scope: 'local',
        source: 'hero',
        type: 'bonus',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 150,
      },
    ],
  },
  {
    id: 104027,
    name: 'COMMON_PLATE_BOOTS_OF_IRON_PRODUCTION',
    slot: 'boots',
    rarity: 'common',
    category: 'wearable',
    basePrice: 500,
    effects: [
      {
        id: 'ironProduction',
        value: 1.025,
        scope: 'local',
        source: 'hero',
        type: 'bonus',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 150,
      },
    ],
  },
  {
    id: 104028,
    name: 'COMMON_PLATE_BOOTS_OF_CROP_PRODUCTION',
    slot: 'boots',
    rarity: 'common',
    category: 'wearable',
    basePrice: 500,
    effects: [
      {
        id: 'wheatProduction',
        value: 1.025,
        scope: 'local',
        source: 'hero',
        type: 'bonus',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 150,
      },
    ],
  },
  {
    id: 104029,
    name: 'COMMON_PLATE_BOOTS_OF_STRENGTH',
    slot: 'boots',
    rarity: 'common',
    category: 'wearable',
    basePrice: 500,
    heroBonus: [
      {
        attribute: 'power',
        value: 250,
      },
    ],
  },
  {
    id: 104030,
    name: 'COMMON_PLATE_BOOTS_OF_PROTECTION',
    slot: 'boots',
    rarity: 'common',
    category: 'wearable',
    basePrice: 500,
    heroBonus: [
      {
        attribute: 'power',
        value: 150,
      },
      {
        attribute: 'damageReduction',
        value: 1,
      },
    ],
  },
  {
    id: 104031,
    name: 'UNCOMMON_LEATHER_BOOTS_OF_WOOD',
    slot: 'boots',
    rarity: 'uncommon',
    category: 'wearable',
    basePrice: 1500,
    effects: [
      {
        id: 'woodProduction',
        value: 100,
        scope: 'local',
        source: 'hero',
        type: 'base',
      },
    ],
    heroBonus: [
      {
        attribute: 'damageReduction',
        value: 4,
      },
    ],
  },
  {
    id: 104032,
    name: 'UNCOMMON_LEATHER_BOOTS_OF_CLAY',
    slot: 'boots',
    rarity: 'uncommon',
    category: 'wearable',
    basePrice: 1500,
    effects: [
      {
        id: 'clayProduction',
        value: 100,
        scope: 'local',
        source: 'hero',
        type: 'base',
      },
    ],
    heroBonus: [
      {
        attribute: 'damageReduction',
        value: 4,
      },
    ],
  },
  {
    id: 104033,
    name: 'UNCOMMON_LEATHER_BOOTS_OF_IRON',
    slot: 'boots',
    rarity: 'uncommon',
    category: 'wearable',
    basePrice: 1500,
    effects: [
      {
        id: 'ironProduction',
        value: 100,
        scope: 'local',
        source: 'hero',
        type: 'base',
      },
    ],
    heroBonus: [
      {
        attribute: 'damageReduction',
        value: 4,
      },
    ],
  },
  {
    id: 104034,
    name: 'UNCOMMON_LEATHER_BOOTS_OF_CROP',
    slot: 'boots',
    rarity: 'uncommon',
    category: 'wearable',
    basePrice: 1500,
    effects: [
      {
        id: 'wheatProduction',
        value: 100,
        scope: 'local',
        source: 'hero',
        type: 'base',
      },
    ],
    heroBonus: [
      {
        attribute: 'damageReduction',
        value: 4,
      },
    ],
  },
  {
    id: 104035,
    name: 'UNCOMMON_LEATHER_BOOTS_OF_WOOD_PRODUCTION',
    slot: 'boots',
    rarity: 'uncommon',
    category: 'wearable',
    basePrice: 1500,
    effects: [
      {
        id: 'woodProduction',
        value: 1.05,
        scope: 'local',
        source: 'hero',
        type: 'bonus',
      },
    ],
    heroBonus: [
      {
        attribute: 'damageReduction',
        value: 4,
      },
    ],
  },
  {
    id: 104036,
    name: 'UNCOMMON_LEATHER_BOOTS_OF_CLAY_PRODUCTION',
    slot: 'boots',
    rarity: 'uncommon',
    category: 'wearable',
    basePrice: 1500,
    effects: [
      {
        id: 'clayProduction',
        value: 1.05,
        scope: 'local',
        source: 'hero',
        type: 'bonus',
      },
    ],
    heroBonus: [
      {
        attribute: 'damageReduction',
        value: 4,
      },
    ],
  },
  {
    id: 104037,
    name: 'UNCOMMON_LEATHER_BOOTS_OF_IRON_PRODUCTION',
    slot: 'boots',
    rarity: 'uncommon',
    category: 'wearable',
    basePrice: 1500,
    effects: [
      {
        id: 'ironProduction',
        value: 1.05,
        scope: 'local',
        source: 'hero',
        type: 'bonus',
      },
    ],
    heroBonus: [
      {
        attribute: 'damageReduction',
        value: 4,
      },
    ],
  },
  {
    id: 104038,
    name: 'UNCOMMON_LEATHER_BOOTS_OF_CROP_PRODUCTION',
    slot: 'boots',
    rarity: 'uncommon',
    category: 'wearable',
    basePrice: 1500,
    effects: [
      {
        id: 'wheatProduction',
        value: 1.05,
        scope: 'local',
        source: 'hero',
        type: 'bonus',
      },
    ],
    heroBonus: [
      {
        attribute: 'damageReduction',
        value: 4,
      },
    ],
  },
  {
    id: 104039,
    name: 'UNCOMMON_LEATHER_BOOTS_OF_STRENGTH',
    slot: 'boots',
    rarity: 'uncommon',
    category: 'wearable',
    basePrice: 1500,
    heroBonus: [
      {
        attribute: 'power',
        value: 100,
      },
      {
        attribute: 'damageReduction',
        value: 4,
      },
    ],
  },
  {
    id: 104040,
    name: 'UNCOMMON_LEATHER_BOOTS_OF_PROTECTION',
    slot: 'boots',
    rarity: 'uncommon',
    category: 'wearable',
    basePrice: 1500,
    heroBonus: [
      {
        attribute: 'damageReduction',
        value: 5,
      },
    ],
  },
  {
    id: 104041,
    name: 'UNCOMMON_MAIL_BOOTS_OF_WOOD',
    slot: 'boots',
    rarity: 'uncommon',
    category: 'wearable',
    basePrice: 1500,
    effects: [
      {
        id: 'woodProduction',
        value: 100,
        scope: 'local',
        source: 'hero',
        type: 'base',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 150,
      },
      {
        attribute: 'damageReduction',
        value: 2,
      },
    ],
  },
  {
    id: 104042,
    name: 'UNCOMMON_MAIL_BOOTS_OF_CLAY',
    slot: 'boots',
    rarity: 'uncommon',
    category: 'wearable',
    basePrice: 1500,
    effects: [
      {
        id: 'clayProduction',
        value: 100,
        scope: 'local',
        source: 'hero',
        type: 'base',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 150,
      },
      {
        attribute: 'damageReduction',
        value: 2,
      },
    ],
  },
  {
    id: 104043,
    name: 'UNCOMMON_MAIL_BOOTS_OF_IRON',
    slot: 'boots',
    rarity: 'uncommon',
    category: 'wearable',
    basePrice: 1500,
    effects: [
      {
        id: 'ironProduction',
        value: 100,
        scope: 'local',
        source: 'hero',
        type: 'base',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 150,
      },
      {
        attribute: 'damageReduction',
        value: 2,
      },
    ],
  },
  {
    id: 104044,
    name: 'UNCOMMON_MAIL_BOOTS_OF_CROP',
    slot: 'boots',
    rarity: 'uncommon',
    category: 'wearable',
    basePrice: 1500,
    effects: [
      {
        id: 'wheatProduction',
        value: 100,
        scope: 'local',
        source: 'hero',
        type: 'base',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 150,
      },
      {
        attribute: 'damageReduction',
        value: 2,
      },
    ],
  },
  {
    id: 104045,
    name: 'UNCOMMON_MAIL_BOOTS_OF_WOOD_PRODUCTION',
    slot: 'boots',
    rarity: 'uncommon',
    category: 'wearable',
    basePrice: 1500,
    effects: [
      {
        id: 'woodProduction',
        value: 1.05,
        scope: 'local',
        source: 'hero',
        type: 'bonus',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 150,
      },
      {
        attribute: 'damageReduction',
        value: 2,
      },
    ],
  },
  {
    id: 104046,
    name: 'UNCOMMON_MAIL_BOOTS_OF_CLAY_PRODUCTION',
    slot: 'boots',
    rarity: 'uncommon',
    category: 'wearable',
    basePrice: 1500,
    effects: [
      {
        id: 'clayProduction',
        value: 1.05,
        scope: 'local',
        source: 'hero',
        type: 'bonus',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 150,
      },
      {
        attribute: 'damageReduction',
        value: 2,
      },
    ],
  },
  {
    id: 104047,
    name: 'UNCOMMON_MAIL_BOOTS_OF_IRON_PRODUCTION',
    slot: 'boots',
    rarity: 'uncommon',
    category: 'wearable',
    basePrice: 1500,
    effects: [
      {
        id: 'ironProduction',
        value: 1.05,
        scope: 'local',
        source: 'hero',
        type: 'bonus',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 150,
      },
      {
        attribute: 'damageReduction',
        value: 2,
      },
    ],
  },
  {
    id: 104048,
    name: 'UNCOMMON_MAIL_BOOTS_OF_CROP_PRODUCTION',
    slot: 'boots',
    rarity: 'uncommon',
    category: 'wearable',
    basePrice: 1500,
    effects: [
      {
        id: 'wheatProduction',
        value: 1.05,
        scope: 'local',
        source: 'hero',
        type: 'bonus',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 150,
      },
      {
        attribute: 'damageReduction',
        value: 2,
      },
    ],
  },
  {
    id: 104049,
    name: 'UNCOMMON_MAIL_BOOTS_OF_STRENGTH',
    slot: 'boots',
    rarity: 'uncommon',
    category: 'wearable',
    basePrice: 1500,
    heroBonus: [
      {
        attribute: 'power',
        value: 250,
      },
      {
        attribute: 'damageReduction',
        value: 2,
      },
    ],
  },
  {
    id: 104050,
    name: 'UNCOMMON_MAIL_BOOTS_OF_PROTECTION',
    slot: 'boots',
    rarity: 'uncommon',
    category: 'wearable',
    basePrice: 1500,
    heroBonus: [
      {
        attribute: 'power',
        value: 150,
      },
      {
        attribute: 'damageReduction',
        value: 3,
      },
    ],
  },
  {
    id: 104051,
    name: 'UNCOMMON_PLATE_BOOTS_OF_WOOD',
    slot: 'boots',
    rarity: 'uncommon',
    category: 'wearable',
    basePrice: 1500,
    effects: [
      {
        id: 'woodProduction',
        value: 100,
        scope: 'local',
        source: 'hero',
        type: 'base',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 300,
      },
    ],
  },
  {
    id: 104052,
    name: 'UNCOMMON_PLATE_BOOTS_OF_CLAY',
    slot: 'boots',
    rarity: 'uncommon',
    category: 'wearable',
    basePrice: 1500,
    effects: [
      {
        id: 'clayProduction',
        value: 100,
        scope: 'local',
        source: 'hero',
        type: 'base',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 300,
      },
    ],
  },
  {
    id: 104053,
    name: 'UNCOMMON_PLATE_BOOTS_OF_IRON',
    slot: 'boots',
    rarity: 'uncommon',
    category: 'wearable',
    basePrice: 1500,
    effects: [
      {
        id: 'ironProduction',
        value: 100,
        scope: 'local',
        source: 'hero',
        type: 'base',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 300,
      },
    ],
  },
  {
    id: 104054,
    name: 'UNCOMMON_PLATE_BOOTS_OF_CROP',
    slot: 'boots',
    rarity: 'uncommon',
    category: 'wearable',
    basePrice: 1500,
    effects: [
      {
        id: 'wheatProduction',
        value: 100,
        scope: 'local',
        source: 'hero',
        type: 'base',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 300,
      },
    ],
  },
  {
    id: 104055,
    name: 'UNCOMMON_PLATE_BOOTS_OF_WOOD_PRODUCTION',
    slot: 'boots',
    rarity: 'uncommon',
    category: 'wearable',
    basePrice: 1500,
    effects: [
      {
        id: 'woodProduction',
        value: 1.05,
        scope: 'local',
        source: 'hero',
        type: 'bonus',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 300,
      },
    ],
  },
  {
    id: 104056,
    name: 'UNCOMMON_PLATE_BOOTS_OF_CLAY_PRODUCTION',
    slot: 'boots',
    rarity: 'uncommon',
    category: 'wearable',
    basePrice: 1500,
    effects: [
      {
        id: 'clayProduction',
        value: 1.05,
        scope: 'local',
        source: 'hero',
        type: 'bonus',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 300,
      },
    ],
  },
  {
    id: 104057,
    name: 'UNCOMMON_PLATE_BOOTS_OF_IRON_PRODUCTION',
    slot: 'boots',
    rarity: 'uncommon',
    category: 'wearable',
    basePrice: 1500,
    effects: [
      {
        id: 'ironProduction',
        value: 1.05,
        scope: 'local',
        source: 'hero',
        type: 'bonus',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 300,
      },
    ],
  },
  {
    id: 104058,
    name: 'UNCOMMON_PLATE_BOOTS_OF_CROP_PRODUCTION',
    slot: 'boots',
    rarity: 'uncommon',
    category: 'wearable',
    basePrice: 1500,
    effects: [
      {
        id: 'wheatProduction',
        value: 1.05,
        scope: 'local',
        source: 'hero',
        type: 'bonus',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 300,
      },
    ],
  },
  {
    id: 104059,
    name: 'UNCOMMON_PLATE_BOOTS_OF_STRENGTH',
    slot: 'boots',
    rarity: 'uncommon',
    category: 'wearable',
    basePrice: 1500,
    heroBonus: [
      {
        attribute: 'power',
        value: 400,
      },
    ],
  },
  {
    id: 104060,
    name: 'UNCOMMON_PLATE_BOOTS_OF_PROTECTION',
    slot: 'boots',
    rarity: 'uncommon',
    category: 'wearable',
    basePrice: 1500,
    heroBonus: [
      {
        attribute: 'power',
        value: 300,
      },
      {
        attribute: 'damageReduction',
        value: 1,
      },
    ],
  },
  {
    id: 104061,
    name: 'RARE_LEATHER_BOOTS_OF_WOOD',
    slot: 'boots',
    rarity: 'rare',
    category: 'wearable',
    basePrice: 3000,
    effects: [
      {
        id: 'woodProduction',
        value: 150,
        scope: 'local',
        source: 'hero',
        type: 'base',
      },
    ],
    heroBonus: [
      {
        attribute: 'damageReduction',
        value: 6,
      },
    ],
  },
  {
    id: 104062,
    name: 'RARE_LEATHER_BOOTS_OF_CLAY',
    slot: 'boots',
    rarity: 'rare',
    category: 'wearable',
    basePrice: 3000,
    effects: [
      {
        id: 'clayProduction',
        value: 150,
        scope: 'local',
        source: 'hero',
        type: 'base',
      },
    ],
    heroBonus: [
      {
        attribute: 'damageReduction',
        value: 6,
      },
    ],
  },
  {
    id: 104063,
    name: 'RARE_LEATHER_BOOTS_OF_IRON',
    slot: 'boots',
    rarity: 'rare',
    category: 'wearable',
    basePrice: 3000,
    effects: [
      {
        id: 'ironProduction',
        value: 150,
        scope: 'local',
        source: 'hero',
        type: 'base',
      },
    ],
    heroBonus: [
      {
        attribute: 'damageReduction',
        value: 6,
      },
    ],
  },
  {
    id: 104064,
    name: 'RARE_LEATHER_BOOTS_OF_CROP',
    slot: 'boots',
    rarity: 'rare',
    category: 'wearable',
    basePrice: 3000,
    effects: [
      {
        id: 'wheatProduction',
        value: 150,
        scope: 'local',
        source: 'hero',
        type: 'base',
      },
    ],
    heroBonus: [
      {
        attribute: 'damageReduction',
        value: 6,
      },
    ],
  },
  {
    id: 104065,
    name: 'RARE_LEATHER_BOOTS_OF_WOOD_PRODUCTION',
    slot: 'boots',
    rarity: 'rare',
    category: 'wearable',
    basePrice: 3000,
    effects: [
      {
        id: 'woodProduction',
        value: 1.075,
        scope: 'local',
        source: 'hero',
        type: 'bonus',
      },
    ],
    heroBonus: [
      {
        attribute: 'damageReduction',
        value: 6,
      },
    ],
  },
  {
    id: 104066,
    name: 'RARE_LEATHER_BOOTS_OF_CLAY_PRODUCTION',
    slot: 'boots',
    rarity: 'rare',
    category: 'wearable',
    basePrice: 3000,
    effects: [
      {
        id: 'clayProduction',
        value: 1.075,
        scope: 'local',
        source: 'hero',
        type: 'bonus',
      },
    ],
    heroBonus: [
      {
        attribute: 'damageReduction',
        value: 6,
      },
    ],
  },
  {
    id: 104067,
    name: 'RARE_LEATHER_BOOTS_OF_IRON_PRODUCTION',
    slot: 'boots',
    rarity: 'rare',
    category: 'wearable',
    basePrice: 3000,
    effects: [
      {
        id: 'ironProduction',
        value: 1.075,
        scope: 'local',
        source: 'hero',
        type: 'bonus',
      },
    ],
    heroBonus: [
      {
        attribute: 'damageReduction',
        value: 6,
      },
    ],
  },
  {
    id: 104068,
    name: 'RARE_LEATHER_BOOTS_OF_CROP_PRODUCTION',
    slot: 'boots',
    rarity: 'rare',
    category: 'wearable',
    basePrice: 3000,
    effects: [
      {
        id: 'wheatProduction',
        value: 1.075,
        scope: 'local',
        source: 'hero',
        type: 'bonus',
      },
    ],
    heroBonus: [
      {
        attribute: 'damageReduction',
        value: 6,
      },
    ],
  },
  {
    id: 104069,
    name: 'RARE_LEATHER_BOOTS_OF_STRENGTH',
    slot: 'boots',
    rarity: 'rare',
    category: 'wearable',
    basePrice: 3000,
    heroBonus: [
      {
        attribute: 'power',
        value: 100,
      },
      {
        attribute: 'damageReduction',
        value: 6,
      },
    ],
  },
  {
    id: 104070,
    name: 'RARE_LEATHER_BOOTS_OF_PROTECTION',
    slot: 'boots',
    rarity: 'rare',
    category: 'wearable',
    basePrice: 3000,
    heroBonus: [
      {
        attribute: 'damageReduction',
        value: 7,
      },
    ],
  },
  {
    id: 104071,
    name: 'RARE_MAIL_BOOTS_OF_WOOD',
    slot: 'boots',
    rarity: 'rare',
    category: 'wearable',
    basePrice: 3000,
    effects: [
      {
        id: 'woodProduction',
        value: 150,
        scope: 'local',
        source: 'hero',
        type: 'base',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 225,
      },
      {
        attribute: 'damageReduction',
        value: 3,
      },
    ],
  },
  {
    id: 104072,
    name: 'RARE_MAIL_BOOTS_OF_CLAY',
    slot: 'boots',
    rarity: 'rare',
    category: 'wearable',
    basePrice: 3000,
    effects: [
      {
        id: 'clayProduction',
        value: 150,
        scope: 'local',
        source: 'hero',
        type: 'base',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 225,
      },
      {
        attribute: 'damageReduction',
        value: 3,
      },
    ],
  },
  {
    id: 104073,
    name: 'RARE_MAIL_BOOTS_OF_IRON',
    slot: 'boots',
    rarity: 'rare',
    category: 'wearable',
    basePrice: 3000,
    effects: [
      {
        id: 'ironProduction',
        value: 150,
        scope: 'local',
        source: 'hero',
        type: 'base',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 225,
      },
      {
        attribute: 'damageReduction',
        value: 3,
      },
    ],
  },
  {
    id: 104074,
    name: 'RARE_MAIL_BOOTS_OF_CROP',
    slot: 'boots',
    rarity: 'rare',
    category: 'wearable',
    basePrice: 3000,
    effects: [
      {
        id: 'wheatProduction',
        value: 150,
        scope: 'local',
        source: 'hero',
        type: 'base',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 225,
      },
      {
        attribute: 'damageReduction',
        value: 3,
      },
    ],
  },
  {
    id: 104075,
    name: 'RARE_MAIL_BOOTS_OF_WOOD_PRODUCTION',
    slot: 'boots',
    rarity: 'rare',
    category: 'wearable',
    basePrice: 3000,
    effects: [
      {
        id: 'woodProduction',
        value: 1.075,
        scope: 'local',
        source: 'hero',
        type: 'bonus',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 225,
      },
      {
        attribute: 'damageReduction',
        value: 3,
      },
    ],
  },
  {
    id: 104076,
    name: 'RARE_MAIL_BOOTS_OF_CLAY_PRODUCTION',
    slot: 'boots',
    rarity: 'rare',
    category: 'wearable',
    basePrice: 3000,
    effects: [
      {
        id: 'clayProduction',
        value: 1.075,
        scope: 'local',
        source: 'hero',
        type: 'bonus',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 225,
      },
      {
        attribute: 'damageReduction',
        value: 3,
      },
    ],
  },
  {
    id: 104077,
    name: 'RARE_MAIL_BOOTS_OF_IRON_PRODUCTION',
    slot: 'boots',
    rarity: 'rare',
    category: 'wearable',
    basePrice: 3000,
    effects: [
      {
        id: 'ironProduction',
        value: 1.075,
        scope: 'local',
        source: 'hero',
        type: 'bonus',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 225,
      },
      {
        attribute: 'damageReduction',
        value: 3,
      },
    ],
  },
  {
    id: 104078,
    name: 'RARE_MAIL_BOOTS_OF_CROP_PRODUCTION',
    slot: 'boots',
    rarity: 'rare',
    category: 'wearable',
    basePrice: 3000,
    effects: [
      {
        id: 'wheatProduction',
        value: 1.075,
        scope: 'local',
        source: 'hero',
        type: 'bonus',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 225,
      },
      {
        attribute: 'damageReduction',
        value: 3,
      },
    ],
  },
  {
    id: 104079,
    name: 'RARE_MAIL_BOOTS_OF_STRENGTH',
    slot: 'boots',
    rarity: 'rare',
    category: 'wearable',
    basePrice: 3000,
    heroBonus: [
      {
        attribute: 'power',
        value: 325,
      },
      {
        attribute: 'damageReduction',
        value: 3,
      },
    ],
  },
  {
    id: 104080,
    name: 'RARE_MAIL_BOOTS_OF_PROTECTION',
    slot: 'boots',
    rarity: 'rare',
    category: 'wearable',
    basePrice: 3000,
    heroBonus: [
      {
        attribute: 'power',
        value: 225,
      },
      {
        attribute: 'damageReduction',
        value: 4,
      },
    ],
  },
  {
    id: 104081,
    name: 'RARE_PLATE_BOOTS_OF_WOOD',
    slot: 'boots',
    rarity: 'rare',
    category: 'wearable',
    basePrice: 3000,
    effects: [
      {
        id: 'woodProduction',
        value: 150,
        scope: 'local',
        source: 'hero',
        type: 'base',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 450,
      },
    ],
  },
  {
    id: 104082,
    name: 'RARE_PLATE_BOOTS_OF_CLAY',
    slot: 'boots',
    rarity: 'rare',
    category: 'wearable',
    basePrice: 3000,
    effects: [
      {
        id: 'clayProduction',
        value: 150,
        scope: 'local',
        source: 'hero',
        type: 'base',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 450,
      },
    ],
  },
  {
    id: 104083,
    name: 'RARE_PLATE_BOOTS_OF_IRON',
    slot: 'boots',
    rarity: 'rare',
    category: 'wearable',
    basePrice: 3000,
    effects: [
      {
        id: 'ironProduction',
        value: 150,
        scope: 'local',
        source: 'hero',
        type: 'base',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 450,
      },
    ],
  },
  {
    id: 104084,
    name: 'RARE_PLATE_BOOTS_OF_CROP',
    slot: 'boots',
    rarity: 'rare',
    category: 'wearable',
    basePrice: 3000,
    effects: [
      {
        id: 'wheatProduction',
        value: 150,
        scope: 'local',
        source: 'hero',
        type: 'base',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 450,
      },
    ],
  },
  {
    id: 104085,
    name: 'RARE_PLATE_BOOTS_OF_WOOD_PRODUCTION',
    slot: 'boots',
    rarity: 'rare',
    category: 'wearable',
    basePrice: 3000,
    effects: [
      {
        id: 'woodProduction',
        value: 1.075,
        scope: 'local',
        source: 'hero',
        type: 'bonus',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 450,
      },
    ],
  },
  {
    id: 104086,
    name: 'RARE_PLATE_BOOTS_OF_CLAY_PRODUCTION',
    slot: 'boots',
    rarity: 'rare',
    category: 'wearable',
    basePrice: 3000,
    effects: [
      {
        id: 'clayProduction',
        value: 1.075,
        scope: 'local',
        source: 'hero',
        type: 'bonus',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 450,
      },
    ],
  },
  {
    id: 104087,
    name: 'RARE_PLATE_BOOTS_OF_IRON_PRODUCTION',
    slot: 'boots',
    rarity: 'rare',
    category: 'wearable',
    basePrice: 3000,
    effects: [
      {
        id: 'ironProduction',
        value: 1.075,
        scope: 'local',
        source: 'hero',
        type: 'bonus',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 450,
      },
    ],
  },
  {
    id: 104088,
    name: 'RARE_PLATE_BOOTS_OF_CROP_PRODUCTION',
    slot: 'boots',
    rarity: 'rare',
    category: 'wearable',
    basePrice: 3000,
    effects: [
      {
        id: 'wheatProduction',
        value: 1.075,
        scope: 'local',
        source: 'hero',
        type: 'bonus',
      },
    ],
    heroBonus: [
      {
        attribute: 'power',
        value: 450,
      },
    ],
  },
  {
    id: 104089,
    name: 'RARE_PLATE_BOOTS_OF_STRENGTH',
    slot: 'boots',
    rarity: 'rare',
    category: 'wearable',
    basePrice: 3000,
    heroBonus: [
      {
        attribute: 'power',
        value: 550,
      },
    ],
  },
  {
    id: 104090,
    name: 'RARE_PLATE_BOOTS_OF_PROTECTION',
    slot: 'boots',
    rarity: 'rare',
    category: 'wearable',
    basePrice: 3000,
    heroBonus: [
      {
        attribute: 'power',
        value: 450,
      },
      {
        attribute: 'damageReduction',
        value: 1,
      },
    ],
  },
];

export const items: HeroItem[] = [
  ...artifacts,
  ...horses,
  ...consumables,
  ...boots,
];

// Use this for faster lookups
export const itemsMap = new Map<HeroItem['id'], HeroItem>(
  items.map((heroItem) => [heroItem.id, heroItem]),
);
