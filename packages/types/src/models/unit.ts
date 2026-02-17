import { z } from 'zod';
import type { Building } from './building';
import type { Tribe } from './tribe';

export const romanUnitIdSchema = z.enum([
  'LEGIONNAIRE',
  'PRAETORIAN',
  'IMPERIAN',
  'EQUITES_IMPERATORIS',
  'EQUITES_CAESARIS',
  'ROMAN_SCOUT',
  'ROMAN_RAM',
  'ROMAN_CATAPULT',
  'ROMAN_CHIEF',
  'ROMAN_SETTLER',
]);

export type RomanUnitId = z.infer<typeof romanUnitIdSchema>;

export const gaulUnitIdSchema = z.enum([
  'PHALANX',
  'SWORDSMAN',
  'THEUTATES_THUNDER',
  'DRUIDRIDER',
  'HAEDUAN',
  'GAUL_SCOUT',
  'GAUL_RAM',
  'GAUL_CATAPULT',
  'GAUL_CHIEF',
  'GAUL_SETTLER',
]);

export type GaulUnitId = z.infer<typeof gaulUnitIdSchema>;

export const teutonUnitIdSchema = z.enum([
  'CLUBSWINGER',
  'SPEARMAN',
  'AXEMAN',
  'PALADIN',
  'TEUTONIC_KNIGHT',
  'TEUTONIC_SCOUT',
  'TEUTONIC_RAM',
  'TEUTONIC_CATAPULT',
  'TEUTONIC_CHIEF',
  'TEUTONIC_SETTLER',
]);

export type TeutonUnitId = z.infer<typeof teutonUnitIdSchema>;

export const hunUnitIdSchema = z.enum([
  'MERCENARY',
  'BOWMAN',
  'STEPPE_RIDER',
  'MARKSMAN',
  'MARAUDER',
  'HUN_SCOUT',
  'HUN_RAM',
  'HUN_CATAPULT',
  'HUN_CHIEF',
  'HUN_SETTLER',
]);

export type HunUnitId = z.infer<typeof hunUnitIdSchema>;

export const egyptianUnitIdSchema = z.enum([
  'SLAVE_MILITIA',
  'ASH_WARDEN',
  'KHOPESH_WARRIOR',
  'ANHUR_GUARD',
  'RESHEPH_CHARIOT',
  'EGYPTIAN_SCOUT',
  'EGYPTIAN_RAM',
  'EGYPTIAN_CATAPULT',
  'EGYPTIAN_CHIEF',
  'EGYPTIAN_SETTLER',
]);

export type EgyptianUnitId = z.infer<typeof egyptianUnitIdSchema>;

export const spartanUnitIdSchema = z.enum([
  'HOPLITE',
  'SHIELDSMAN',
  'TWINSTEEL_THERION',
  'ELPIDA_RIDER',
  'CORINTHIAN_CRUSHER',
  'SPARTAN_SCOUT',
  'SPARTAN_RAM',
  'SPARTAN_CATAPULT',
  'SPARTAN_CHIEF',
  'SPARTAN_SETTLER',
]);

export type SpartanUnitId = z.infer<typeof spartanUnitIdSchema>;

export const natarUnitIdSchema = z.enum([
  'PIKEMAN',
  'THORNED_WARRIOR',
  'GUARDSMAN',
  'AXERIDER',
  'NATARIAN_KNIGHT',
  'NATARIAN_SCOUT',
  'NATARIAN_RAM',
  'NATARIAN_CATAPULT',
  'NATARIAN_CHIEF',
  'NATARIAN_SETTLER',
]);

export type NatarUnitId = z.infer<typeof natarUnitIdSchema>;

export const natureUnitIdSchema = z.enum([
  'RAT',
  'SPIDER',
  'SERPENT',
  'BAT',
  'WILD_BOAR',
  'WOLF',
  'BEAR',
  'CROCODILE',
  'TIGER',
  'ELEPHANT',
]);

export type NatureUnitId = z.infer<typeof natureUnitIdSchema>;

export const heroUnitIdSchema = z.literal('HERO');

export const unitIdSchema = z
  .union([
    heroUnitIdSchema,
    romanUnitIdSchema,
    gaulUnitIdSchema,
    teutonUnitIdSchema,
    hunUnitIdSchema,
    egyptianUnitIdSchema,
    spartanUnitIdSchema,
    natarUnitIdSchema,
    natureUnitIdSchema,
  ])
  .meta({ id: 'UnitId' });

export type UnitId = z.infer<typeof unitIdSchema>;

export type UnitResearchRequirement = {
  buildingId: Building['id'];
  level: number;
};

type UnitTier =
  | 'tier-1'
  | 'tier-2'
  | 'tier-3'
  | 'scout'
  | 'tier-4'
  | 'tier-5'
  | 'siege-ram'
  | 'siege-catapult'
  | 'special'
  | 'hero';

export type Unit = {
  id: UnitId;
  baseRecruitmentCost: [number, number, number, number];
  baseRecruitmentDuration: number;
  attack: number;
  infantryDefence: number;
  cavalryDefence: number;
  unitSpeed: number;
  unitCarryCapacity: number;
  unitWheatConsumption: number;
  category: 'infantry' | 'cavalry' | 'siege' | 'special' | 'hero';
  tribe: Tribe | 'all';
  tier: UnitTier;
  researchRequirements: UnitResearchRequirement[];
};
