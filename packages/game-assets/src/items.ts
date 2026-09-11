import type {
  EffectId,
  ResourceProductionEffectId,
  TroopTrainingDurationEffectId,
} from '@pillage-first/types/models/effect';
import type {
  ArtifactId,
  HeroEquipmentItem,
  HeroItem,
} from '@pillage-first/types/models/hero-item';

// All artifacts begin with the 10_ prefix
type ArtifactRarity = Extract<
  HeroItem['rarity'],
  'common' | 'uncommon' | 'rare'
>;

type ArtifactTier = {
  rarity: ArtifactRarity;
  namePrefix: Uppercase<ArtifactRarity>;
  flatResourceProduction: number;
  resourceProductionBonus: number;
  durationReduction: number;
  crannyCapacity: number;
  revealedIncomingTroopsAmount: number;
  merchantCapacity: number;
  unitImprovementDuration: number;
  unitSpeed: number;
  basePrice: number;
};

type ArtifactEffect = NonNullable<HeroItem['effects']>[number];

type ArtifactDefinition = {
  name: ArtifactId;
  rarity: ArtifactTier['rarity'];
  effects: ArtifactEffect[];
};

const artifactTiers: ArtifactTier[] = [
  {
    rarity: 'common',
    namePrefix: 'COMMON',
    flatResourceProduction: 50,
    resourceProductionBonus: 1.05,
    durationReduction: 0.9,
    crannyCapacity: 1000,
    revealedIncomingTroopsAmount: 20,
    merchantCapacity: 1.1,
    unitImprovementDuration: 0.9,
    unitSpeed: 1.05,
    basePrice: 1000,
  },
  {
    rarity: 'uncommon',
    namePrefix: 'UNCOMMON',
    flatResourceProduction: 100,
    resourceProductionBonus: 1.075,
    durationReduction: 0.8,
    crannyCapacity: 2000,
    revealedIncomingTroopsAmount: 50,
    merchantCapacity: 1.2,
    unitImprovementDuration: 0.7,
    unitSpeed: 1.1,
    basePrice: 2000,
  },
  {
    rarity: 'rare',
    namePrefix: 'RARE',
    flatResourceProduction: 150,
    resourceProductionBonus: 1.1,
    durationReduction: 0.7,
    crannyCapacity: 3000,
    revealedIncomingTroopsAmount: 100,
    merchantCapacity: 1.3,
    unitImprovementDuration: 0.5,
    unitSpeed: 1.15,
    basePrice: 3000,
  },
];

const resourceProductionEffectIds: {
  effectId: ResourceProductionEffectId;
  nameSegment: 'WOOD' | 'CLAY' | 'IRON' | 'WHEAT';
}[] = [
  { effectId: 'woodProduction', nameSegment: 'WOOD' },
  { effectId: 'clayProduction', nameSegment: 'CLAY' },
  { effectId: 'ironProduction', nameSegment: 'IRON' },
  { effectId: 'wheatProduction', nameSegment: 'WHEAT' },
];

const troopTrainingDurationEffectIds: TroopTrainingDurationEffectId[] = [
  'residenceTrainingDuration',
  'barracksTrainingDuration',
  'greatBarracksTrainingDuration',
  'stableTrainingDuration',
  'greatStableTrainingDuration',
  'workshopTrainingDuration',
  'hospitalTrainingDuration',
];

const createArtifactEffect = (
  id: EffectId,
  value: number,
  type: ArtifactEffect['type'],
): ArtifactEffect => ({
  id,
  value,
  type,
  scope: 'local',
  source: 'artifact',
});

const createArtifactName = (tier: ArtifactTier, suffix: string): ArtifactId => {
  return `${tier.namePrefix}_ARTIFACT_${suffix}` as ArtifactId;
};

const getArtifactBasePrice = (rarity: ArtifactRarity): number => {
  return artifactTiers.find((tier) => tier.rarity === rarity)!.basePrice;
};

const resourceProductionArtifacts: ArtifactDefinition[] = artifactTiers.flatMap(
  (tier) =>
    resourceProductionEffectIds.flatMap(({ effectId, nameSegment }) => [
      {
        name: createArtifactName(tier, `${nameSegment}_PRODUCTION`),
        rarity: tier.rarity,
        effects: [
          createArtifactEffect(effectId, tier.flatResourceProduction, 'base'),
        ],
      },
      {
        name: createArtifactName(tier, `${nameSegment}_PRODUCTION_BONUS`),
        rarity: tier.rarity,
        effects: [
          createArtifactEffect(effectId, tier.resourceProductionBonus, 'bonus'),
        ],
      },
    ]),
);

const buildTimeArtifacts: ArtifactDefinition[] = artifactTiers.map((tier) => ({
  name: createArtifactName(tier, 'BUILD_TIME_REDUCTION'),
  rarity: tier.rarity,
  effects: [
    createArtifactEffect('buildingDuration', tier.durationReduction, 'bonus'),
  ],
}));

const crannyCapacityArtifacts: ArtifactDefinition[] = artifactTiers.map(
  (tier) => ({
    name: createArtifactName(tier, 'CRANNY_CAPACITY'),
    rarity: tier.rarity,
    effects: [
      createArtifactEffect('crannyCapacity', tier.crannyCapacity, 'base'),
    ],
  }),
);

const troopTrainingArtifacts: ArtifactDefinition[] = artifactTiers.map(
  (tier) => ({
    name: createArtifactName(tier, 'TROOP_TRAINING_REDUCTION'),
    rarity: tier.rarity,
    effects: troopTrainingDurationEffectIds.map((effectId) =>
      createArtifactEffect(effectId, tier.durationReduction, 'bonus'),
    ),
  }),
);

const revealedIncomingTroopsArtifacts: ArtifactDefinition[] = artifactTiers.map(
  (tier) => ({
    name: createArtifactName(tier, 'REVEALED_INCOMING_TROOPS'),
    rarity: tier.rarity,
    effects: [
      createArtifactEffect(
        'revealedIncomingTroopsAmount',
        tier.revealedIncomingTroopsAmount,
        'base',
      ),
    ],
  }),
);

const merchantCapacityArtifacts: ArtifactDefinition[] = artifactTiers.map(
  (tier) => ({
    name: createArtifactName(tier, 'MERCHANT_CAPACITY'),
    rarity: tier.rarity,
    effects: [
      createArtifactEffect('merchantCapacity', tier.merchantCapacity, 'bonus'),
    ],
  }),
);

const unitImprovementDurationArtifacts: ArtifactDefinition[] =
  artifactTiers.map((tier) => ({
    name: createArtifactName(tier, 'UNIT_IMPROVEMENT_DURATION'),
    rarity: tier.rarity,
    effects: [
      createArtifactEffect(
        'unitImprovementDuration',
        tier.unitImprovementDuration,
        'bonus',
      ),
    ],
  }));

const unitSpeedArtifacts: ArtifactDefinition[] = artifactTiers.flatMap(
  (tier) => [
    {
      name: createArtifactName(tier, 'UNIT_SPEED'),
      rarity: tier.rarity,
      effects: [createArtifactEffect('unitSpeed', tier.unitSpeed, 'bonus')],
    },
    {
      name: createArtifactName(tier, 'UNIT_SPEED_AFTER_20_FIELDS'),
      rarity: tier.rarity,
      effects: [
        createArtifactEffect('unitSpeedAfter20Fields', tier.unitSpeed, 'bonus'),
      ],
    },
  ],
);

const artifactDefinitions: ArtifactDefinition[] = [
  ...resourceProductionArtifacts,
  ...buildTimeArtifacts,
  ...crannyCapacityArtifacts,
  ...troopTrainingArtifacts,
  ...revealedIncomingTroopsArtifacts,
  ...merchantCapacityArtifacts,
  ...unitImprovementDurationArtifacts,
  ...unitSpeedArtifacts,
];

export const artifacts: HeroItem[] = artifactDefinitions.map(
  ({ name, rarity, effects }, index) => ({
    id: 10_001 + index,
    name,
    slot: 'non-equipable',
    rarity,
    category: 'artifact',
    basePrice: getArtifactBasePrice(rarity),
    effects,
  }),
);

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
