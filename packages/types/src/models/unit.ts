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
export type RomanSettlerUnitId = 'ROMAN_SETTLER';
export type RomanChiefUnitId = 'ROMAN_CHIEF';
export type RomanScoutUnitId = 'ROMAN_SCOUT';
export type RomanSiegeUnitId = 'ROMAN_RAM' | 'ROMAN_CATAPULT';

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
export type GaulSettlerUnitId = 'GAUL_SETTLER';
export type GaulChiefUnitId = 'GAUL_CHIEF';
export type GaulScoutUnitId = 'GAUL_SCOUT';
export type GaulSiegeUnitId = 'GAUL_RAM' | 'GAUL_CATAPULT';

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
export type TeutonSettlerUnitId = 'TEUTONIC_SETTLER';
export type TeutonChiefUnitId = 'TEUTONIC_CHIEF';
export type TeutonScoutUnitId = 'TEUTONIC_SCOUT';
export type TeutonSiegeUnitId = 'TEUTONIC_RAM' | 'TEUTONIC_CATAPULT';

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
export type HunSettlerUnitId = 'HUN_SETTLER';
export type HunChiefUnitId = 'HUN_CHIEF';
export type HunScoutUnitId = 'HUN_SCOUT';
export type HunSiegeUnitId = 'HUN_RAM' | 'HUN_CATAPULT';

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
export type EgyptianSettlerUnitId = 'EGYPTIAN_SETTLER';
export type EgyptianChiefUnitId = 'EGYPTIAN_CHIEF';
export type EgyptianScoutUnitId = 'EGYPTIAN_SCOUT';
export type EgyptianSiegeUnitId = 'EGYPTIAN_RAM' | 'EGYPTIAN_CATAPULT';

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
export type SpartanSettlerUnitId = 'SPARTAN_SETTLER';
export type SpartanChiefUnitId = 'SPARTAN_CHIEF';
export type SpartanScoutUnitId = 'SPARTAN_SCOUT';
export type SpartanSiegeUnitId = 'SPARTAN_RAM' | 'SPARTAN_CATAPULT';

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
export type NatarSettlerUnitId = 'NATARIAN_SETTLER';
export type NatarChiefUnitId = 'NATARIAN_CHIEF';
export type NatarScoutUnitId = 'NATARIAN_SCOUT';
export type NatarSiegeUnitId = 'NATARIAN_RAM' | 'NATARIAN_CATAPULT';

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

type SettlerUnitId =
  | RomanSettlerUnitId
  | GaulSettlerUnitId
  | TeutonSettlerUnitId
  | HunSettlerUnitId
  | EgyptianSettlerUnitId
  | SpartanSettlerUnitId
  | NatarSettlerUnitId;

type ChiefUnitId =
  | RomanChiefUnitId
  | GaulChiefUnitId
  | TeutonChiefUnitId
  | HunChiefUnitId
  | EgyptianChiefUnitId
  | SpartanChiefUnitId
  | NatarChiefUnitId;

type ScoutUnitId =
  | RomanScoutUnitId
  | GaulScoutUnitId
  | TeutonScoutUnitId
  | HunScoutUnitId
  | EgyptianScoutUnitId
  | SpartanScoutUnitId
  | NatarScoutUnitId
  | 'BAT';

type SiegeUnitId =
  | RomanSiegeUnitId
  | GaulSiegeUnitId
  | TeutonSiegeUnitId
  | HunSiegeUnitId
  | EgyptianSiegeUnitId
  | SpartanSiegeUnitId
  | NatarSiegeUnitId;

type BaseUnit = {
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

type Tier1Unit = BaseUnit & {
  tier: 'tier-1';
  researchRequirements: [];
};

type SettlerUnit = BaseUnit & {
  id: SettlerUnitId;
  category: 'special';
  tier: 'special';
  researchRequirements: [];
};

type ChiefUnit = BaseUnit & {
  id: ChiefUnitId;
  category: 'special';
  tier: 'special';
};

type ScoutUnit = BaseUnit & {
  id: ScoutUnitId;
  tier: 'scout';
};

type SiegeUnit = BaseUnit & {
  id: SiegeUnitId;
  category: 'siege';
  researchRequirements: [
    { buildingId: 'ACADEMY'; level: number },
    { buildingId: 'WORKSHOP'; level: number },
  ];
};

type CavalryUnit = BaseUnit & {
  category: 'cavalry';
  researchRequirements: [
    { buildingId: 'ACADEMY'; level: number },
    { buildingId: 'STABLE'; level: number },
  ];
};

type HeroUnit = BaseUnit & {
  id: 'HERO';
  category: 'hero';
  tier: 'hero';
  tribe: 'all';
  researchRequirements: [];
};

type OtherUnit = BaseUnit & {
  id: Exclude<
    UnitId,
    | SettlerUnitId
    | ChiefUnitId
    | ScoutUnitId
    | SiegeUnitId
    | 'HERO'
    | Extract<
        UnitId,
        | 'LEGIONNAIRE'
        | 'PHALANX'
        | 'CLUBSWINGER'
        | 'SLAVE_MILITIA'
        | 'MERCENARY'
        | 'HOPLITE'
        | 'RAT'
        | 'PIKEMAN'
      >
  >;
};

export type Unit =
  | HeroUnit
  | SettlerUnit
  | ChiefUnit
  | ScoutUnit
  | SiegeUnit
  | CavalryUnit
  | Tier1Unit
  | OtherUnit;
