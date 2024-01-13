import { Tribe } from 'interfaces/models/game/tribe';
import { Building } from 'interfaces/models/game/building';

export type RomanUnitId =
  | 'LEGIONNAIRE'
  | 'PRAETORIAN'
  | 'IMPERIAN'
  | 'EQUITES_LEGATI'
  | 'EQUITES_IMPERATORIS'
  | 'EQUITES_CAESARIS'
  | 'BATTERING_RAM'
  | 'FIRE_CATAPULT'
  | 'SENATOR'
  | 'ROMAN_SETTLER';

export type GaulUnitId =
  | 'PHALANX'
  | 'SWORDSMAN'
  | 'PATHFINDER'
  | 'THEUTATES_THUNDER'
  | 'DRUIDRIDER'
  | 'HAEDUAN'
  | 'GAUL_RAM'
  | 'TREBUCHET'
  | 'CHIEFTAIN'
  | 'GAUL_SETTLER';

export type TeutonUnitId =
  | 'MACEMAN'
  | 'SPEARMAN'
  | 'AXEMAN'
  | 'SCOUT'
  | 'PALADIN'
  | 'TEUTONIC_KNIGHT'
  | 'TEUTONIC_RAM'
  | 'ONAGER'
  | 'CHIEF'
  | 'TEUTONIC_SETTLER';

export type HunUnitId =
  | 'MERCENARY'
  | 'BOWMAN'
  | 'SPOTTER'
  | 'STEPPE_RIDER'
  | 'MARKSMAN'
  | 'MARAUDER'
  | 'HUN_RAM'
  | 'MANGONEL'
  | 'LOGADES'
  | 'HUN_SETTLER';

export type EgyptianUnitId =
  | 'SLAVE_MILITIA'
  | 'ASH_WARDEN'
  | 'KHOPESH_WARRIOR'
  | 'SOPDU_EXPLORER'
  | 'ANHUR_GUARD'
  | 'RESHEPH_CHARIOT'
  | 'EGYPTIAN_RAM'
  | 'STONE_CATAPULT'
  | 'NOMARCH'
  | 'EGYPTIAN_SETTLER';

export type SpartanUnitId =
  | 'HOPLITE'
  | 'SENTINEL'
  | 'SHIELDSMAN'
  | 'TWINSTEEL_THERION'
  | 'ELPIDA_RIDER'
  | 'CORINTHIAN_CRUSHER'
  | 'SPARTAN_RAM'
  | 'BALLISTA'
  | 'EPHOR'
  | 'SPARTAN_SETTLER';

export type NatarUnitId =
  | 'PIKEMAN'
  | 'THORNED_WARRIOR'
  | 'GUARDSMAN'
  | 'BIRDS_OF_PREY'
  | 'AXERIDER'
  | 'NATARIAN_KNIGHT'
  | 'WARELEPHANT'
  | 'NATARIAN_BALLISTA'
  | 'NATARIAN_EMPEROR'
  | 'NATARIAN_SETTLER';

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
  | RomanUnitId
  | GaulUnitId
  | TeutonUnitId
  | EgyptianUnitId
  | HunUnitId
  | SpartanUnitId
  | NatarUnitId
  | NatureUnitId;

export type UnitResearchPrerequisites = `${Building['id']}:${string}`;

export type Unit = {
  id: UnitId;
  baseRecruitmentCost: [number, number, number, number];
  baseRecruitmentTime: number;
  cropConsumption: number;
  attack: number;
  infantryDefence: number;
  cavalryDefence: number;
  travelSpeed: number;
  carryCapacity: number;
  category: 'infantry' | 'cavalry' | 'siege' | 'special';
  tribe: Tribe;
  researchPrerequisites: UnitResearchPrerequisites[];
};
