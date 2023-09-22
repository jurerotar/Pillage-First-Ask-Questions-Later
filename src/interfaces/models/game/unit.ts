import { Tribe } from 'interfaces/models/game/tribe';
import { Building } from 'interfaces/models/game/building';

export type UnitId =
  | 'LEGIONNAIRE'
  | 'PRAETORIAN'
  | 'IMPERIAN'
  | 'EQUITES_LEGATI'
  | 'EQUITES_IMPERATORIS'
  | 'EQUITES_CAESARIS'
  | 'BATTERING_RAM'
  | 'FIRE_CATAPULT'
  | 'SENATOR'
  | 'SETTLER'
  | 'MACEMAN'
  | 'SPEARMAN'
  | 'AXEMAN'
  | 'SCOUT'
  | 'PALADIN'
  | 'TEUTONIC_KNIGHT'
  | 'RAM'
  | 'CATAPULT'
  | 'CHIEF'
  | 'PHALANX'
  | 'SWORDSMAN'
  | 'PATHFINDER'
  | 'THEUTATES_THUNDER'
  | 'DRUIDRIDER'
  | 'HAEDUAN'
  | 'TREBUCHET'
  | 'CHIEFTAIN'
  | 'SLAVE_MILITIA'
  | 'ASH_WARDEN'
  | 'KHOPESH_WARRIOR'
  | 'SOPDU_EXPLORER'
  | 'ANHUR_GUARD'
  | 'RESHEPH_CHARIOT'
  | 'STONE_CATAPULT'
  | 'NOMARCH'
  | 'MERCENARY'
  | 'BOWMAN'
  | 'SPOTTER'
  | 'STEPPE_RIDER'
  | 'MARKSMAN'
  | 'MARAUDER'
  | 'LOGADES'
  | 'PIKEMAN'
  | 'THORNED_WARRIOR'
  | 'GUARDSMAN'
  | 'BIRDS_OF PREY'
  | 'AXERIDER'
  | 'NATARIAN_KNIGHT'
  | 'WARELEPHANT'
  | 'BALLISTA'
  | 'NATARIAN_EMPEROR'
  | 'RAT'
  | 'SPIDER'
  | 'SERPENT'
  | 'BAT'
  | 'WILD_BOAR'
  | 'WOLF'
  | 'BEAR'
  | 'CROCODILE'
  | 'TIGER';

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
  type: 'infantry' | 'cavalry' | 'siege' | 'special';
  tribe: Tribe;
  researchPrerequisites: UnitResearchPrerequisites[];
};
