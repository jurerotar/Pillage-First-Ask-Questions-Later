import { RxCross2 } from 'react-icons/rx';
import {
  LuClock,
  LuShield,
  LuSword,
  LuSwords,
  LuWheat,
  LuWheatOff,
} from 'react-icons/lu';
import { CgTimelapse } from 'react-icons/cg';
import {
  TbBat,
  TbBorderCorners,
  TbBrandSpeedtest,
  TbHorseshoe,
  TbLaurelWreath,
  TbTooltip,
} from 'react-icons/tb';
import { PiKeyhole, PiPath, PiWarehouseBold } from 'react-icons/pi';
import { BiShieldQuarter } from 'react-icons/bi';
import { FaHandshakeAngle, FaPeopleGroup, FaStar } from 'react-icons/fa6';
import {
  BsFillPeopleFill,
  BsMinecartLoaded,
  BsShieldFill,
} from 'react-icons/bs';
import {
  GiBearHead,
  GiBoar,
  GiCrocJaws,
  GiElephant,
  GiGreekTemple,
  GiIBeam,
  GiLeatherBoot,
  GiMetalBar,
  GiPointyHat,
  GiRallyTheTroops,
  GiRat,
  GiSaberToothedCatHead,
  GiSandSnake,
  GiSpyglass,
  GiStoneBlock,
  GiSwapBag,
  GiWolfHead,
  GiWolfTrap,
  GiWoodPile,
} from 'react-icons/gi';
import { FaSpider, FaWarehouse } from 'react-icons/fa';
import { GrDocumentMissing } from 'react-icons/gr';
import { TiMinus, TiPlus } from 'react-icons/ti';
import { SiArtifacthub } from 'react-icons/si';
import { LiaCoinsSolid } from 'react-icons/lia';
import { SlChemistry } from 'react-icons/sl';
import { IoMdArrowRoundDown, IoMdArrowRoundUp } from 'react-icons/io';
import {
  PillageFirstCatapult,
  PillageFirstHorse,
} from '@pillage-first/graphics';
import type { UpperCaseToCamelCase } from 'app/utils/typescript';
import type {
  EgyptianUnitId,
  GaulUnitId,
  HunUnitId,
  NatarUnitId,
  NatureUnitId,
  RomanUnitId,
  TeutonUnitId,
  Unit,
} from 'app/interfaces/models/game/unit';
import type { Effect } from 'app/interfaces/models/game/effect';
import styles from './icons.module.scss';
import type { JSX } from 'react';
import { camelCase } from 'moderndash';

type UncategorizedIconType =
  | 'missingIcon'
  | 'positiveChange'
  | 'negativeChange';

type ReportIconType =
  | 'attackerNoLoss'
  | 'attackerSomeLoss'
  | 'attackerFullLoss'
  | 'defenderNoLoss'
  | 'defenderSomeLoss'
  | 'defenderFullLoss';

type MapControlsIconType =
  | 'mapMagnificationIncrease'
  | 'mapMagnificationDecrease'
  | 'mapReputationToggle'
  | 'mapOasisIconsToggle'
  | 'mapTroopMovementsToggle'
  | 'mapWheatFieldIconToggle'
  | 'mapTileTooltipToggle'
  | 'mapTreasureIconToggle';

type CommonIconType = 'cancel';

type TreasureTileIconType =
  | 'treasureTileItem'
  | 'treasureTileResources'
  | 'treasureTileArtifact'
  | 'treasureTileCurrency'
  | 'treasureTileMiscellaneous';

type ResourceCombinationIconType =
  | 'woodWheat'
  | 'clayWheat'
  | 'ironWheat'
  | 'woodWood'
  | 'clayClay'
  | 'ironIron'
  | 'wheatWheat';

type ResourceIconType = 'wood' | 'clay' | 'iron' | 'wheat';

type VillageIconType = 'populationCropConsumption' | 'troopsCropConsumption';

type RomanTroopIconType = UpperCaseToCamelCase<RomanUnitId>;

type GaulTroopIconType = UpperCaseToCamelCase<GaulUnitId>;

type TeutonTroopIconType = UpperCaseToCamelCase<TeutonUnitId>;

type HunTroopIconType = UpperCaseToCamelCase<HunUnitId>;

type EgyptianTroopIconType = UpperCaseToCamelCase<EgyptianUnitId>;

type NatarTroopIconType = UpperCaseToCamelCase<NatarUnitId>;

type NatureTroopIconType = UpperCaseToCamelCase<NatureUnitId>;

type UnitAttributeType = 'unitSpeed';

export type TroopMovementType =
  | 'deploymentOutgoing'
  | 'deploymentIncoming'
  | 'offensiveMovementOutgoing'
  | 'offensiveMovementIncoming'
  | 'adventure'
  | 'findNewVillage';

export type UnitIconType =
  | 'hero'
  | RomanTroopIconType
  | GaulTroopIconType
  | TeutonTroopIconType
  | HunTroopIconType
  | EgyptianTroopIconType
  | NatarTroopIconType
  | NatureTroopIconType;

type OtherIconType = 'freeCrop' | 'population' | 'culturePoints';

export type IconType =
  | UncategorizedIconType
  | CommonIconType
  | UnitAttributeType
  | ReportIconType
  | ResourceCombinationIconType
  | ResourceIconType
  | MapControlsIconType
  | TreasureTileIconType
  | VillageIconType
  | UnitIconType
  | OtherIconType
  | TroopMovementType
  | Effect['id'];

export const icons: Record<IconType, () => JSX.Element> = {
  missingIcon: () => <GrDocumentMissing className="size-full" />,
  cancel: () => <RxCross2 className="text-red-500" />,
  positiveChange: () => (
    <IoMdArrowRoundUp className="size-full text-green-500" />
  ),
  negativeChange: () => (
    <IoMdArrowRoundDown className="size-full text-green-500" />
  ),

  // Resources
  wood: () => <GiWoodPile className="size-full text-[#A1662F]" />,
  clay: () => <GiStoneBlock className="size-full text-[#cc7357]" />,
  iron: () => <GiMetalBar className="size-full text-gray-500" />,
  wheat: () => <LuWheat className="size-full text-yellow-500 scale-90" />,
  woodWheat: () => icons.wood(),
  clayWheat: () => icons.clay(),
  ironWheat: () => icons.iron(),
  woodWood: () => icons.wood(),
  clayClay: () => icons.clay(),
  ironIron: () => icons.iron(),
  wheatWheat: () => icons.wheat(),

  // Map controls
  mapMagnificationIncrease: () => <TiPlus className="size-full" />,
  mapMagnificationDecrease: () => <TiMinus className="size-full" />,
  mapReputationToggle: () => <TbBorderCorners className="size-full" />,
  mapOasisIconsToggle: () => <GiWoodPile className="size-full" />,
  mapTroopMovementsToggle: () => <LuSwords className="size-full" />,
  mapWheatFieldIconToggle: () => <LuWheat className="size-full" />,
  mapTileTooltipToggle: () => <TbTooltip className="size-full" />,
  mapTreasureIconToggle: () => <SiArtifacthub className="size-full" />,

  // Map treasures
  treasureTileItem: () => <LuSword className="size-full" />,
  treasureTileResources: () => (
    <GiWoodPile className="size-full text-[#A1662F]" />
  ),
  treasureTileArtifact: () => <SiArtifacthub className="size-full" />,
  treasureTileCurrency: () => <LiaCoinsSolid className="size-full" />,
  treasureTileMiscellaneous: () => <SlChemistry className="size-full" />,

  // Reports
  attackerNoLoss: () => <LuSwords className="size-full text-red-500" />,
  attackerSomeLoss: () => <LuSwords className="size-full text-yellow-500" />,
  attackerFullLoss: () => icons.missingIcon(),
  defenderNoLoss: () => <LuShield className="size-full text-green-500" />,
  defenderSomeLoss: () => <LuShield className="size-full text-yellow-500" />,
  defenderFullLoss: () => <LuShield className="size-full text-red-500" />,

  // Effects
  freeCrop: () => <LuWheatOff className="size-full text-yellow-500" />,
  populationCropConsumption: () => (
    <BsFillPeopleFill className="size-full text-yellow-200" />
  ),
  troopsCropConsumption: () => (
    <GiRallyTheTroops className="size-full text-gray-500" />
  ),
  warehouseCapacity: () => <FaWarehouse className="size-full text-stone-500" />,
  granaryCapacity: () => (
    <PiWarehouseBold className="size-full text-stone-500" />
  ),
  buildingDuration: () => <CgTimelapse className="size-full" />,
  infantryDefence: () => (
    <BiShieldQuarter className="size-full text-gray-500" />
  ),
  cavalryDefence: () => <TbHorseshoe className="size-full text-gray-500" />,
  population: () => <FaPeopleGroup className="size-full text-gray-400" />,
  culturePoints: () => <GiGreekTemple className="size-full text-gray-400" />,
  attack: () => <LuSwords className="size-full text-gray-500" />,
  defence: () => <BiShieldQuarter className="size-full text-gray-500" />,
  defenceBonus: () => <BiShieldQuarter className="size-full text-gray-500" />,
  barracksTrainingDuration: () => <LuClock className="size-full" />,
  greatBarracksTrainingDuration: () => <LuClock className="size-full" />,
  stableTrainingDuration: () => <LuClock className="size-full" />,
  greatStableTrainingDuration: () => <LuClock className="size-full" />,
  workshopTrainingDuration: () => <LuClock className="size-full" />,
  hospitalTrainingDuration: () => <LuClock className="size-full" />,
  unitSpeed: () => <TbBrandSpeedtest className="size-full" />,
  unitCarryCapacity: () => <GiSwapBag className="size-full text-gray-500" />,
  unitWheatConsumption: () => <LuWheat className="size-full text-yellow-500" />,
  trapperCapacity: () => <GiWolfTrap className="size-full" />,
  merchantCapacity: () => <BsMinecartLoaded className="size-full" />,
  merchantAmount: () => <FaHandshakeAngle className="size-full" />,
  woodProduction: () => icons.wood(),
  clayProduction: () => icons.clay(),
  ironProduction: () => icons.iron(),
  wheatProduction: () => icons.wheat(),
  unitImprovementDuration: () => <LuClock className="size-full" />,
  unitResearchDuration: () => <LuClock className="size-full" />,
  crannyCapacity: () => <PiKeyhole className="size-full" />,
  revealedIncomingTroopsAmount: () => <GiSpyglass className="size-full" />,
  unitSpeedAfter20Fields: () => (
    <GiLeatherBoot className="size-full text-[#3c2f2f]" />
  ),
  merchantSpeed: () => icons.missingIcon(),

  // Special troops
  hero: () => <FaStar className="size-full text-yellow-300" />,

  // Roman troops
  legionnaire: () => <LuSword className="size-full" />,
  praetorian: () => <LuSword className="size-full" />,
  imperian: () => <LuSword className="size-full" />,
  romanScout: () => <PillageFirstHorse className={styles['roman-scout']} />,
  equitesImperatoris: () => (
    <PillageFirstHorse className={styles['equites-imperatoris']} />
  ),
  equitesCaesaris: () => (
    <PillageFirstHorse className={styles['equites-caesaris']} />
  ),
  romanRam: () => <GiIBeam className="size-full" />,
  romanCatapult: () => <PillageFirstCatapult />,
  romanChief: () => <TbLaurelWreath className="size-full text-green-700" />,
  romanSettler: () => <GiPointyHat className="size-full text-red-600" />,

  // Gaul troops
  phalanx: () => icons.missingIcon(),
  swordsman: () => icons.missingIcon(),
  gaulScout: () => <PillageFirstHorse className={styles['gaul-scout']} />,
  theutatesThunder: () => (
    <PillageFirstHorse className={styles['theutates-thunder']} />
  ),
  druidrider: () => <PillageFirstHorse className={styles.druidrider} />,
  haeduan: () => <PillageFirstHorse className={styles.haeduan} />,
  gaulRam: () => icons.missingIcon(),
  gaulCatapult: () => <PillageFirstCatapult />,
  gaulChief: () => <TbLaurelWreath className="size-full text-green-700" />,
  gaulSettler: () => <GiPointyHat className="size-full text-green-700" />,

  // Teuton troops
  clubswinger: () => icons.missingIcon(),
  spearman: () => icons.missingIcon(),
  axeman: () => icons.missingIcon(),
  teutonicScout: () => icons.missingIcon(),
  paladin: () => <PillageFirstHorse className={styles.paladin} />,
  teutonicKnight: () => (
    <PillageFirstHorse className={styles['teutonic-knight']} />
  ),
  teutonicRam: () => icons.missingIcon(),
  teutonicCatapult: () => <PillageFirstCatapult />,
  teutonicChief: () => <TbLaurelWreath className="size-full text-green-700" />,
  teutonicSettler: () => <GiPointyHat className="size-full text-red-500" />,

  // Egyptian troops
  slaveMilitia: () => icons.missingIcon(),
  ashWarden: () => icons.missingIcon(),
  khopeshWarrior: () => icons.missingIcon(),
  egyptianScout: () => (
    <PillageFirstHorse className={styles['egyptian-scout']} />
  ),
  anhurGuard: () => <PillageFirstHorse className={styles['anhur-guard']} />,
  reshephChariot: () => (
    <PillageFirstHorse className={styles['resheph-chariot']} />
  ),
  egyptianRam: () => icons.missingIcon(),
  egyptianCatapult: () => <PillageFirstCatapult />,
  egyptianChief: () => <TbLaurelWreath className="size-full text-green-700" />,
  egyptianSettler: () => <GiPointyHat className="size-full text-yellow-600" />,

  // Hun troops
  mercenary: () => icons.missingIcon(),
  bowman: () => icons.missingIcon(),
  hunScout: () => icons.missingIcon(),
  steppeRider: () => <PillageFirstHorse className={styles['steppe-rider']} />,
  marksman: () => <PillageFirstHorse className={styles.marksman} />,
  marauder: () => <PillageFirstHorse className={styles.marauder} />,
  hunRam: () => icons.missingIcon(),
  hunCatapult: () => <PillageFirstCatapult />,
  hunChief: () => <TbLaurelWreath className="size-full text-green-700" />,
  hunSettler: () => <GiPointyHat className="size-full text-yellow-800" />,

  // Natarian troops
  pikeman: () => icons.missingIcon(),
  thornedWarrior: () => icons.missingIcon(),
  guardsman: () => icons.missingIcon(),
  axerider: () => <PillageFirstHorse className={styles['']} />,
  natarianScout: () => icons.missingIcon(),
  natarianKnight: () => <PillageFirstHorse className={styles['']} />,
  natarianRam: () => icons.missingIcon(),
  natarianCatapult: () => <PillageFirstCatapult />,
  natarianChief: () => <TbLaurelWreath className="size-full text-green-700" />,
  natarianSettler: () => <GiPointyHat className="size-full text-stone-950" />,

  // Nature
  rat: () => <GiRat className="size-full text-[#4B3C39]" />,
  spider: () => <FaSpider className="size-full text-[#D3C2A3]" />,
  serpent: () => <GiSandSnake className="size-full text-[#B8B62F]" />,
  bat: () => <TbBat className="size-full text-[#545151]" />,
  wildBoar: () => <GiBoar className="size-full text-[#5A3929]" />,
  wolf: () => <GiWolfHead className="size-full text-[#727C83]" />,
  bear: () => <GiBearHead className="size-full text-[#836852]" />,
  crocodile: () => <GiCrocJaws className="size-full text-[#4da167]" />,
  tiger: () => <GiSaberToothedCatHead className="size-full text-[#D49C4A]" />,
  elephant: () => <GiElephant className="size-full" />,

  // Troop movements
  deploymentOutgoing: () => (
    <BsShieldFill className="size-full text-yellow-300" />
  ),
  deploymentIncoming: () => (
    <BsShieldFill className="size-full text-green-600" />
  ),
  offensiveMovementOutgoing: () => (
    <LuSwords className="size-full text-yellow-300" />
  ),
  offensiveMovementIncoming: () => (
    <LuSwords className="size-full text-red-500" />
  ),
  adventure: () => <PiPath className="size-full text-blue-500" />,
  findNewVillage: () => <GiPointyHat className="size-full text-blue-500" />,
};

export const unitIdToUnitIconMapper = (unitId: Unit['id']): UnitIconType => {
  return camelCase(unitId) as UnitIconType;
};
