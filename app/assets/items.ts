import type { HeroItem } from 'app/interfaces/models/game/hero';

const artifacts: HeroItem[] = [
  {
    id: 'UNCOMMON_ARTIFACT_MILITARY_TROOP_TRAVEL_SPEED',
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
      },
    ],
  },
  {
    id: 'UNCOMMON_ARTIFACT_MILITARY_TROOP_CARRYING_CAPACITY',
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
      },
    ],
  },
  {
    id: 'UNCOMMON_ARTIFACT_MILITARY_TROOP_TRAINING_REDUCTION',
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
      },
      {
        id: 'greatBarracksTrainingDuration',
        value: 0.9,
        scope: 'village',
        source: 'artifact',
      },
      {
        id: 'stableTrainingDuration',
        value: 0.9,
        scope: 'village',
        source: 'artifact',
      },
      {
        id: 'greatStableTrainingDuration',
        value: 0.9,
        scope: 'village',
        source: 'artifact',
      },
      {
        id: 'workshopTrainingDuration',
        value: 0.9,
        scope: 'village',
        source: 'artifact',
      },
      {
        id: 'hospitalTrainingDuration',
        value: 0.9,
        scope: 'village',
        source: 'artifact',
      },
    ],
  },
  {
    id: 'UNCOMMON_ARTIFACT_MILITARY_TROOP_WHEAT_CONSUMPTION_REDUCTION',
    slot: 'non-equipable',
    rarity: 'uncommon',
    category: 'artifact',
    basePrice: null,
    effects: [
      {
        id: 'unitWheatConsumptionReduction',
        value: 0.9,
        scope: 'village',
        source: 'artifact',
      },
    ],
  },
  {
    id: 'UNCOMMON_ARTIFACT_CIVIL_BUILD_TIME_REDUCTION',
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
      },
    ],
  },
  {
    id: 'UNCOMMON_ARTIFACT_CIVIL_OASIS_PRODUCTION_BONUS',
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
    id: 'UNCOMMON_ARTIFACT_CIVIL_RESOURCE_PRODUCTION_BONUS',
    slot: 'non-equipable',
    rarity: 'uncommon',
    category: 'artifact',
    basePrice: null,
    effects: [
      {
        id: 'woodProductionBonus',
        value: 1.1,
        scope: 'village',
        source: 'artifact',
      },
      {
        id: 'clayProductionBonus',
        value: 1.1,
        scope: 'village',
        source: 'artifact',
      },
      {
        id: 'ironProductionBonus',
        value: 1.1,
        scope: 'village',
        source: 'artifact',
      },
      {
        id: 'wheatProductionBonus',
        value: 1.1,
        scope: 'village',
        source: 'artifact',
      },
    ],
  },
  // Rare
  {
    id: 'RARE_ARTIFACT_MILITARY_TROOP_TRAVEL_SPEED',
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
      },
    ],
  },
  {
    id: 'RARE_ARTIFACT_MILITARY_TROOP_CARRYING_CAPACITY',
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
      },
    ],
  },
  {
    id: 'RARE_ARTIFACT_MILITARY_TROOP_TRAINING_REDUCTION',
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
      },
      {
        id: 'greatBarracksTrainingDuration',
        value: 0.5,
        scope: 'village',
        source: 'artifact',
      },
      {
        id: 'stableTrainingDuration',
        value: 0.5,
        scope: 'village',
        source: 'artifact',
      },
      {
        id: 'greatStableTrainingDuration',
        value: 0.5,
        scope: 'village',
        source: 'artifact',
      },
      {
        id: 'workshopTrainingDuration',
        value: 0.5,
        scope: 'village',
        source: 'artifact',
      },
      {
        id: 'hospitalTrainingDuration',
        value: 0.5,
        scope: 'village',
        source: 'artifact',
      },
    ],
  },
  {
    id: 'RARE_ARTIFACT_MILITARY_TROOP_WHEAT_CONSUMPTION_REDUCTION',
    slot: 'non-equipable',
    rarity: 'rare',
    category: 'artifact',
    basePrice: null,
    effects: [
      {
        id: 'unitWheatConsumptionReduction',
        value: 0.5,
        scope: 'village',
        source: 'artifact',
      },
    ],
  },
  {
    id: 'RARE_ARTIFACT_CIVIL_BUILD_TIME_REDUCTION',
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
      },
    ],
  },
  {
    id: 'RARE_ARTIFACT_CIVIL_OASIS_PRODUCTION_BONUS',
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
    id: 'RARE_ARTIFACT_CIVIL_RESOURCE_PRODUCTION_BONUS',
    slot: 'non-equipable',
    rarity: 'rare',
    category: 'artifact',
    basePrice: null,
    effects: [
      {
        id: 'woodProductionBonus',
        value: 1.5,
        scope: 'village',
        source: 'artifact',
      },
      {
        id: 'clayProductionBonus',
        value: 1.5,
        scope: 'village',
        source: 'artifact',
      },
      {
        id: 'ironProductionBonus',
        value: 1.5,
        scope: 'village',
        source: 'artifact',
      },
      {
        id: 'wheatProductionBonus',
        value: 1.5,
        scope: 'village',
        source: 'artifact',
      },
    ],
  },
  // Epic
  {
    id: 'EPIC_ARTIFACT_MILITARY_TROOP_TRAVEL_SPEED',
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
      },
    ],
  },
  {
    id: 'EPIC_ARTIFACT_MILITARY_TROOP_CARRYING_CAPACITY',
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
      },
    ],
  },
  {
    id: 'EPIC_ARTIFACT_MILITARY_TROOP_TRAINING_REDUCTION',
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
      },
      {
        id: 'greatBarracksTrainingDuration',
        value: 0.5,
        scope: 'global',
        source: 'artifact',
      },
      {
        id: 'stableTrainingDuration',
        value: 0.5,
        scope: 'global',
        source: 'artifact',
      },
      {
        id: 'greatStableTrainingDuration',
        value: 0.5,
        scope: 'global',
        source: 'artifact',
      },
      {
        id: 'workshopTrainingDuration',
        value: 0.5,
        scope: 'global',
        source: 'artifact',
      },
      {
        id: 'hospitalTrainingDuration',
        value: 0.5,
        scope: 'global',
        source: 'artifact',
      },
    ],
  },
  {
    id: 'EPIC_ARTIFACT_MILITARY_TROOP_WHEAT_CONSUMPTION_REDUCTION',
    slot: 'non-equipable',
    rarity: 'epic',
    category: 'artifact',
    basePrice: null,
    effects: [
      {
        id: 'unitWheatConsumptionReduction',
        value: 0.5,
        scope: 'global',
        source: 'artifact',
      },
    ],
  },
  {
    id: 'EPIC_ARTIFACT_CIVIL_BUILD_TIME_REDUCTION',
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
      },
    ],
  },
  {
    id: 'EPIC_ARTIFACT_CIVIL_OASIS_PRODUCTION_BONUS',
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
    id: 'EPIC_ARTIFACT_CIVIL_RESOURCE_PRODUCTION_BONUS',
    slot: 'non-equipable',
    rarity: 'epic',
    category: 'artifact',
    basePrice: null,
    effects: [
      {
        id: 'woodProductionBonus',
        value: 1.5,
        scope: 'global',
        source: 'artifact',
      },
      {
        id: 'clayProductionBonus',
        value: 1.5,
        scope: 'global',
        source: 'artifact',
      },
      {
        id: 'ironProductionBonus',
        value: 1.5,
        scope: 'global',
        source: 'artifact',
      },
      {
        id: 'wheatProductionBonus',
        value: 1.5,
        scope: 'global',
        source: 'artifact',
      },
    ],
  },
  {
    id: 'EPIC_ARTIFACT_CIVIL_ENABLE_GREAT_BUILDINGS',
    slot: 'non-equipable',
    rarity: 'epic',
    category: 'artifact',
    basePrice: null,
    effects: [],
  },
];

export const items: HeroItem[] = [
  ...artifacts,
  {
    id: 'HEALING_POTION',
    slot: 'consumable',
    rarity: 'common',
    category: 'consumable',
    basePrice: 5,
  },
  {
    id: 'BOOK_OF_WISDOM',
    slot: 'consumable',
    rarity: 'common',
    category: 'consumable',
    basePrice: 100,
  },
  {
    id: 'ANIMAL_CAGE',
    slot: 'consumable',
    rarity: 'common',
    category: 'consumable',
    basePrice: 20,
  },
  {
    id: 'REVIVAL_POTION',
    slot: 'consumable',
    rarity: 'common',
    category: 'consumable',
    basePrice: 20,
  },
  {
    id: 'SILVER',
    slot: 'consumable',
    rarity: 'common',
    category: 'currency',
    basePrice: null,
  },
  {
    id: 'WOOD',
    slot: 'consumable',
    rarity: 'common',
    category: 'resource',
    basePrice: null,
  },
  {
    id: 'CLAY',
    slot: 'consumable',
    rarity: 'common',
    category: 'resource',
    basePrice: null,
  },
  {
    id: 'IRON',
    slot: 'consumable',
    rarity: 'common',
    category: 'resource',
    basePrice: null,
  },
  {
    id: 'WHEAT',
    slot: 'consumable',
    rarity: 'common',
    category: 'resource',
    basePrice: null,
  },
];
