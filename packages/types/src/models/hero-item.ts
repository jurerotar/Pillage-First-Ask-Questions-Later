import { z } from 'zod';
import type { Effect } from './effect';

export type HeroItemRarity = 'common' | 'uncommon' | 'rare' | 'epic';

type HeroItemCategory = 'consumable' | 'currency' | 'wearable' | 'artifact';

export type HeroItemSlot =
  | 'head'
  | 'torso'
  | 'legs'
  | 'boots'
  | 'right-hand'
  | 'left-hand'
  | 'horse'
  | 'consumable'
  | 'non-equipable';

type UppercaseHeroItemRarity<
  Item extends string,
  Rarity extends HeroItemRarity = HeroItemRarity,
> = `${Uppercase<Rarity>}_${Item}`;

type HeroHorseItemId = UppercaseHeroItemRarity<'HORSE'>;

type HeroConsumableItemId =
  | 'SILVER'
  | 'HEALING_POTION'
  | 'BOOK_OF_WISDOM'
  | 'ANIMAL_CAGE'
  | 'REVIVAL_POTION'
  | 'EXPERIENCE_SCROLL'
  | 'ADVENTURE_MAP'
  | 'LOYALTY_SEAL';

type ArtifactRarity = Uppercase<
  Extract<HeroItemRarity, 'common' | 'uncommon' | 'rare'>
>;

type ResourceArtifactResource = 'WOOD' | 'CLAY' | 'IRON' | 'WHEAT';

type ResourceArtifactId =
  `${ArtifactRarity}_ARTIFACT_${ResourceArtifactResource}_PRODUCTION${'' | '_BONUS'}`;

type MilitaryArtifactId =
  `${ArtifactRarity}_ARTIFACT_${'TROOP_TRAINING_REDUCTION' | 'UNIT_SPEED' | 'UNIT_SPEED_AFTER_20_FIELDS'}`;

type CivilArtifactId =
  `${ArtifactRarity}_ARTIFACT_${'BUILD_TIME_REDUCTION' | 'CRANNY_CAPACITY' | 'REVEALED_INCOMING_TROOPS' | 'MERCHANT_CAPACITY' | 'UNIT_IMPROVEMENT_DURATION'}`;

export type ArtifactId =
  | ResourceArtifactId
  | MilitaryArtifactId
  | CivilArtifactId;

type HeroEquipmentArmorTypeId = 'LEATHER' | 'MAIL' | 'PLATE';

type HeroHandEquipmentItemKindId = 'SWORD' | 'SHIELD';

type HeroArmorEquipmentItemId = UppercaseHeroItemRarity<
  `${HeroEquipmentArmorTypeId}_BODY_ARMOR`,
  Exclude<HeroItemRarity, 'epic'>
>;

type HeroBootsEquipmentItemId = UppercaseHeroItemRarity<
  'BOOTS',
  Exclude<HeroItemRarity, 'epic'>
>;

type HeroHelmetEquipmentItemId = UppercaseHeroItemRarity<
  'HELMET',
  Exclude<HeroItemRarity, 'epic'>
>;

type HeroLegGuardsEquipmentItemId = UppercaseHeroItemRarity<
  'LEG_GUARDS',
  Exclude<HeroItemRarity, 'epic'>
>;

type HeroHandEquipmentItemId = UppercaseHeroItemRarity<
  HeroHandEquipmentItemKindId,
  Exclude<HeroItemRarity, 'epic'>
>;

export type HeroEquipmentItemId =
  | HeroArmorEquipmentItemId
  | HeroBootsEquipmentItemId
  | HeroHelmetEquipmentItemId
  | HeroLegGuardsEquipmentItemId
  | HeroHandEquipmentItemId;

type HeroBonus = {
  attribute:
    | 'power'
    | 'speed'
    | 'damageReduction'
    | 'experienceModifier'
    | 'healthRegeneration';
  value: number;
};

type HeroItemId =
  | HeroHorseItemId
  | HeroConsumableItemId
  | ArtifactId
  | HeroEquipmentItemId;

export type HeroItem = {
  id: number;
  name: HeroItemId;
  slot: HeroItemSlot;
  rarity: HeroItemRarity;
  category: HeroItemCategory;
  // Base price of null indicates item can't be bought or sold
  basePrice: number | null;
  // Source specifier is item id
  effects?: Omit<Effect, 'sourceSpecifier' | 'tileId'>[];
  heroBonus?: HeroBonus[];
};

export type HeroEquipmentItem = HeroItem & {
  name: HeroEquipmentItemId;
  slot: Extract<
    HeroItemSlot,
    'head' | 'torso' | 'legs' | 'boots' | 'right-hand' | 'left-hand'
  >;
  category: Extract<HeroItemCategory, 'wearable'>;
};

export const heroItemSchema = z
  .strictObject({
    id: z.number(),
    amount: z.number().int().positive(),
  })
  .meta({ id: 'HeroItem' });
