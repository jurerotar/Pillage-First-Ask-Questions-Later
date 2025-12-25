import { z } from 'zod';
import type { Building } from 'app/interfaces/models/game/building';
import type { Tribe } from 'app/interfaces/models/game/tribe';

type ComputedUnits<
  T extends
    | 'roman'
    | 'gaul'
    | 'hun'
    | 'egyptian'
    | 'natarian'
    | 'teutonic'
    | 'spartan',
> = `${Uppercase<T>}_${'SCOUT' | 'RAM' | 'CATAPULT' | 'CHIEF' | 'SETTLER'}`;

export type RomanUnitId =
  | 'LEGIONNAIRE'
  | 'PRAETORIAN'
  | 'IMPERIAN'
  | 'EQUITES_IMPERATORIS'
  | 'EQUITES_CAESARIS'
  | ComputedUnits<'roman'>;

export type GaulUnitId =
  | 'PHALANX'
  | 'SWORDSMAN'
  | 'THEUTATES_THUNDER'
  | 'DRUIDRIDER'
  | 'HAEDUAN'
  | ComputedUnits<'gaul'>;

export type TeutonUnitId =
  | 'CLUBSWINGER'
  | 'SPEARMAN'
  | 'AXEMAN'
  | 'PALADIN'
  | 'TEUTONIC_KNIGHT'
  | ComputedUnits<'teutonic'>;

export type HunUnitId =
  | 'MERCENARY'
  | 'BOWMAN'
  | 'STEPPE_RIDER'
  | 'MARKSMAN'
  | 'MARAUDER'
  | ComputedUnits<'hun'>;

export type EgyptianUnitId =
  | 'SLAVE_MILITIA'
  | 'ASH_WARDEN'
  | 'KHOPESH_WARRIOR'
  | 'ANHUR_GUARD'
  | 'RESHEPH_CHARIOT'
  | ComputedUnits<'egyptian'>;

type SpartanUnitId =
  | 'HOPLITE'
  | 'SHIELDSMAN'
  | 'TWINSTEEL_THERION'
  | 'ELPIDA_RIDER'
  | 'CORINTHIAN_CRUSHER'
  | ComputedUnits<'spartan'>;

export type NatarUnitId =
  | 'PIKEMAN'
  | 'THORNED_WARRIOR'
  | 'GUARDSMAN'
  | 'AXERIDER'
  | 'NATARIAN_KNIGHT'
  | ComputedUnits<'natarian'>;

export type NatureUnitId =
  | 'RAT'
  | 'SPIDER'
  | 'SERPENT'
  | 'BAT'
  | 'WILD_BOAR'
  | 'WOLF'
  | 'BEAR'
  | 'CROCODILE'
  | 'TIGER'
  | 'ELEPHANT';

export type UnitId =
  | 'HERO'
  | RomanUnitId
  | GaulUnitId
  | TeutonUnitId
  | EgyptianUnitId
  | HunUnitId
  | SpartanUnitId
  | NatarUnitId
  | NatureUnitId;

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

export const unitIdSchema = z.string() as z.ZodType<UnitId>;
