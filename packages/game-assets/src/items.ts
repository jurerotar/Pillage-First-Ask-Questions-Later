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
    id: 1030,
    name: 'EXPERIENCE_SCROLL',
    slot: 'non-equipable',
    rarity: 'common',
    category: 'consumable',
    basePrice: 50,
  },
  {
    id: 1031,
    name: 'ADVENTURE_MAP',
    slot: 'non-equipable',
    rarity: 'common',
    category: 'consumable',
    basePrice: 200,
  },
  {
    id: 1032,
    name: 'LOYALTY_SEAL',
    slot: 'non-equipable',
    rarity: 'common',
    category: 'consumable',
    basePrice: 75,
  },
];

type EquipmentRarity = {
  id: Extract<HeroEquipmentItem['rarity'], 'common' | 'uncommon' | 'rare'>;
  power: number;
  damageReduction: number;
  basePrice: number;
};

type EquipmentArmorType = {
  id: 'LEATHER' | 'MAIL' | 'PLATE';
  powerMultiplier: number;
  damageReductionMultiplier: number;
};

type HandEquipmentItemKind = {
  id: 'SWORD' | 'SHIELD';
  slot: Extract<HeroEquipmentItem['slot'], 'right-hand' | 'left-hand'>;
  bonusAttribute: Extract<
    NonNullable<HeroEquipmentItem['heroBonus']>[number]['attribute'],
    'power' | 'damageReduction'
  >;
  value: (rarity: EquipmentRarity) => number;
};

const equipmentItemKindOffset = 2;
const equipmentItemKindCount = 4;
const equipmentEffectCount = 10;

const equipmentRarities: EquipmentRarity[] = [
  {
    id: 'common',
    power: 150,
    damageReduction: 2,
    basePrice: 500,
  },
  {
    id: 'uncommon',
    power: 300,
    damageReduction: 4,
    basePrice: 1500,
  },
  {
    id: 'rare',
    power: 450,
    damageReduction: 6,
    basePrice: 3000,
  },
];

const equipmentArmorTypes: EquipmentArmorType[] = [
  {
    id: 'LEATHER',
    powerMultiplier: 0,
    damageReductionMultiplier: 1,
  },
  {
    id: 'MAIL',
    powerMultiplier: 0.5,
    damageReductionMultiplier: 0.5,
  },
  {
    id: 'PLATE',
    powerMultiplier: 1,
    damageReductionMultiplier: 0,
  },
];

const handEquipmentItemKinds: HandEquipmentItemKind[] = [
  {
    id: 'SWORD',
    slot: 'right-hand',
    bonusAttribute: 'power',
    value: (rarity) => rarity.power,
  },
  {
    id: 'SHIELD',
    slot: 'left-hand',
    bonusAttribute: 'damageReduction',
    value: (rarity) => rarity.damageReduction,
  },
];

const getBodyArmorEquipmentName = (
  rarity: EquipmentRarity,
  armorType: EquipmentArmorType,
): HeroEquipmentItem['name'] => {
  return `${rarity.id.toUpperCase()}_${armorType.id}_BODY_ARMOR` as HeroEquipmentItem['name'];
};

const getBodyArmorHeroBonus = (
  rarity: EquipmentRarity,
  armorType: EquipmentArmorType,
): NonNullable<HeroEquipmentItem['heroBonus']> => {
  const power = rarity.power * armorType.powerMultiplier;
  const damageReduction =
    rarity.damageReduction * armorType.damageReductionMultiplier;

  return [
    ...(power > 0 ? [{ attribute: 'power' as const, value: power }] : []),
    ...(damageReduction > 0
      ? [{ attribute: 'damageReduction' as const, value: damageReduction }]
      : []),
  ];
};

const getEquipmentItemId = (index: number): HeroEquipmentItem['id'] =>
  104001 + index;

const getBootsEquipmentName = (
  rarity: EquipmentRarity,
): HeroEquipmentItem['name'] => {
  return `${rarity.id.toUpperCase()}_BOOTS` as HeroEquipmentItem['name'];
};

const getHelmetEquipmentName = (
  rarity: EquipmentRarity,
): HeroEquipmentItem['name'] => {
  return `${rarity.id.toUpperCase()}_HELMET` as HeroEquipmentItem['name'];
};

const getLegGuardsEquipmentName = (
  rarity: EquipmentRarity,
): HeroEquipmentItem['name'] => {
  return `${rarity.id.toUpperCase()}_LEG_GUARDS` as HeroEquipmentItem['name'];
};

const getHandEquipmentName = (
  rarity: EquipmentRarity,
  itemKind: HandEquipmentItemKind,
): HeroEquipmentItem['name'] => {
  return `${rarity.id.toUpperCase()}_${itemKind.id}` as HeroEquipmentItem['name'];
};

// All equipment begins with the 104_ prefix
const boots: HeroEquipmentItem[] = equipmentRarities.map((rarity, index) => ({
  id: getEquipmentItemId(index),
  name: getBootsEquipmentName(rarity),
  slot: 'boots',
  rarity: rarity.id,
  category: 'wearable',
  basePrice: rarity.basePrice,
  heroBonus: [
    {
      attribute: 'speed',
      value: 3 + 2 * index,
    },
  ],
}));

const helmets: HeroEquipmentItem[] = equipmentRarities.map((rarity, index) => ({
  id: getEquipmentItemId(equipmentEffectCount + index),
  name: getHelmetEquipmentName(rarity),
  slot: 'head',
  rarity: rarity.id,
  category: 'wearable',
  basePrice: rarity.basePrice,
  heroBonus: [
    {
      attribute: 'experienceModifier',
      value: 5 * (index + 1),
    },
  ],
}));

const legGuards: HeroEquipmentItem[] = equipmentRarities.map(
  (rarity, index) => ({
    id: getEquipmentItemId(
      equipmentEffectCount * (equipmentItemKindOffset + 1) + index,
    ),
    name: getLegGuardsEquipmentName(rarity),
    slot: 'legs',
    rarity: rarity.id,
    category: 'wearable',
    basePrice: rarity.basePrice,
    heroBonus: [
      {
        attribute: 'healthRegeneration',
        value: 10 * (index + 1),
      },
    ],
  }),
);

const bodyArmor: HeroEquipmentItem[] = equipmentRarities.flatMap((rarity) =>
  equipmentArmorTypes.map((armorType, armorTypeIndex) => {
    const heroBonus = getBodyArmorHeroBonus(rarity, armorType);
    const item: HeroEquipmentItem = {
      id: getEquipmentItemId(
        equipmentEffectCount * equipmentItemKindOffset +
          equipmentArmorTypes.length * equipmentRarities.indexOf(rarity) +
          armorTypeIndex,
      ),
      name: getBodyArmorEquipmentName(rarity, armorType),
      slot: 'torso',
      rarity: rarity.id,
      category: 'wearable',
      basePrice: rarity.basePrice,
    };

    if (heroBonus.length > 0) {
      item.heroBonus = heroBonus;
    }

    return item;
  }),
);

const handEquipment: HeroEquipmentItem[] = equipmentRarities.flatMap((rarity) =>
  handEquipmentItemKinds.map((itemKind, itemKindIndex) => ({
    id: getEquipmentItemId(
      equipmentRarities.length *
        equipmentArmorTypes.length *
        equipmentItemKindCount *
        equipmentEffectCount +
        handEquipmentItemKinds.length * equipmentRarities.indexOf(rarity) +
        itemKindIndex,
    ),
    name: getHandEquipmentName(rarity, itemKind),
    slot: itemKind.slot,
    rarity: rarity.id,
    category: 'wearable',
    basePrice: rarity.basePrice,
    heroBonus: [
      {
        attribute: itemKind.bonusAttribute,
        value: itemKind.value(rarity),
      },
    ],
  })),
);

export const items: HeroItem[] = [
  ...artifacts,
  ...horses,
  ...consumables,
  ...boots,
  ...helmets,
  ...legGuards,
  ...bodyArmor,
  ...handEquipment,
];

// Use this for faster lookups
export const itemsMap = new Map<HeroItem['id'], HeroItem>(
  items.map((heroItem) => [heroItem.id, heroItem]),
);
