import { clsx } from 'clsx';
import { camelCase } from 'moderndash';
import type { JSX } from 'react';
import type { IconBaseProps } from 'react-icons';
import { BiShieldQuarter } from 'react-icons/bi';
import {
  BsFillPeopleFill,
  BsMinecartLoaded,
  BsShieldFill,
} from 'react-icons/bs';
import { CgTimelapse } from 'react-icons/cg';
import { FaSpider, FaWarehouse } from 'react-icons/fa';
import { FaHandshakeAngle, FaPeopleGroup, FaStar } from 'react-icons/fa6';
import {
  GiBearHead,
  GiBoar,
  GiCrocJaws,
  GiElephant,
  GiGreekTemple,
  GiIBeam,
  GiLeatherBoot,
  GiPointyHat,
  GiRallyTheTroops,
  GiRat,
  GiSaberToothedCatHead,
  GiSandSnake,
  GiSpyglass,
  GiSwapBag,
  GiWolfHead,
  GiWolfTrap,
} from 'react-icons/gi';
import { GrDocumentMissing } from 'react-icons/gr';
import { IoMdArrowRoundDown, IoMdArrowRoundUp } from 'react-icons/io';
import { LiaCoinsSolid } from 'react-icons/lia';
import { LuClock, LuShield, LuSword, LuSwords } from 'react-icons/lu';
import { PiKeyhole, PiPath, PiWarehouseBold } from 'react-icons/pi';
import { RxCross2 } from 'react-icons/rx';
import { SiArtifacthub } from 'react-icons/si';
import { SlChemistry } from 'react-icons/sl';
import {
  TbBat,
  TbBorderCorners,
  TbBrandSpeedtest,
  TbHorseshoe,
  TbLaurelWreath,
  TbTooltip,
} from 'react-icons/tb';
import { TiMinus, TiPlus } from 'react-icons/ti';
import {
  PillageFirstCatapult,
  PillageFirstClay,
  PillageFirstHorse,
  PillageFirstIron,
  PillageFirstWheat,
  PillageFirstWheatOff,
  PillageFirstWood,
} from '@pillage-first/graphics';
import type { Effect } from '@pillage-first/types/models/effect';
import type {
  EgyptianUnitId,
  GaulUnitId,
  HunUnitId,
  NatarUnitId,
  NatureUnitId,
  RomanUnitId,
  TeutonUnitId,
  Unit,
} from '@pillage-first/types/models/unit';
import type { UpperCaseToCamelCase } from 'app/utils/typescript';
import styles from './icons.module.scss';

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

type TroopMovementType =
  | 'deploymentOutgoing'
  | 'deploymentIncoming'
  | 'offensiveMovementOutgoing'
  | 'offensiveMovementIncoming'
  | 'adventure'
  | 'findNewVillage';

type UnitIconType =
  | 'hero'
  | RomanTroopIconType
  | GaulTroopIconType
  | TeutonTroopIconType
  | HunTroopIconType
  | EgyptianTroopIconType
  | NatarTroopIconType
  | NatureTroopIconType;

type OtherIconType = 'freeCrop' | 'population' | 'culturePoints';

type HeroIconType = 'heroRevivalDuration';

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
  | HeroIconType
  | Effect['id'];

export const icons: Record<IconType, (props: IconBaseProps) => JSX.Element> = {
  missingIcon: (props) => <GrDocumentMissing {...props} />,
  cancel: (props) => (
    <RxCross2
      {...props}
      className={clsx('text-red-500', props.className)}
    />
  ),
  positiveChange: (props) => (
    <IoMdArrowRoundUp
      {...props}
      className={clsx('text-green-500', props.className)}
    />
  ),
  negativeChange: (props) => (
    <IoMdArrowRoundDown
      {...props}
      className={clsx('text-green-500', props.className)}
    />
  ),

  // Resources
  wood: (props) => <PillageFirstWood {...props} />,
  clay: (props) => <PillageFirstClay {...props} />,
  iron: (props) => <PillageFirstIron {...props} />,
  wheat: (props) => <PillageFirstWheat {...props} />,
  woodWheat: (props) => icons.wood(props),
  clayWheat: (props) => icons.clay(props),
  ironWheat: (props) => icons.iron(props),
  woodWood: (props) => icons.wood(props),
  clayClay: (props) => icons.clay(props),
  ironIron: (props) => icons.iron(props),
  wheatWheat: (props) => icons.wheat(props),

  // Map controls
  mapMagnificationIncrease: (props) => <TiPlus {...props} />,
  mapMagnificationDecrease: (props) => <TiMinus {...props} />,
  mapReputationToggle: (props) => <TbBorderCorners {...props} />,
  mapOasisIconsToggle: (props) => icons.wood(props),
  mapTroopMovementsToggle: (props) => <LuSwords {...props} />,
  mapWheatFieldIconToggle: (props) => icons.wheat(props),
  mapTileTooltipToggle: (props) => <TbTooltip {...props} />,
  mapTreasureIconToggle: (props) => <SiArtifacthub {...props} />,

  // Map treasures
  treasureTileItem: (props) => <LuSword {...props} />,
  treasureTileResources: (props) => <PillageFirstWood {...props} />,
  treasureTileArtifact: (props) => <SiArtifacthub {...props} />,
  treasureTileCurrency: (props) => <LiaCoinsSolid {...props} />,
  treasureTileMiscellaneous: (props) => <SlChemistry {...props} />,

  // Reports
  attackerNoLoss: (props) => (
    <LuSwords
      {...props}
      className={clsx('text-red-500', props.className)}
    />
  ),
  attackerSomeLoss: (props) => (
    <LuSwords
      {...props}
      className={clsx('text-yellow-500', props.className)}
    />
  ),
  attackerFullLoss: (props) => icons.missingIcon(props),
  defenderNoLoss: (props) => (
    <LuShield
      {...props}
      className={clsx('text-green-500', props.className)}
    />
  ),
  defenderSomeLoss: (props) => (
    <LuShield
      {...props}
      className={clsx('text-yellow-500', props.className)}
    />
  ),
  defenderFullLoss: (props) => (
    <LuShield
      {...props}
      className={clsx('text-red-500', props.className)}
    />
  ),

  // Effects

  freeCrop: (props) => <PillageFirstWheatOff {...props} />,
  populationCropConsumption: (props) => (
    <BsFillPeopleFill
      {...props}
      className={clsx('text-yellow-200', props.className)}
    />
  ),
  troopsCropConsumption: (props) => (
    <GiRallyTheTroops
      {...props}
      className={clsx('text-gray-500', props.className)}
    />
  ),
  warehouseCapacity: (props) => (
    <FaWarehouse
      {...props}
      className={clsx('text-stone-500', props.className)}
    />
  ),
  granaryCapacity: (props) => (
    <PiWarehouseBold
      {...props}
      className={clsx('text-stone-500', props.className)}
    />
  ),
  buildingDuration: (props) => <CgTimelapse {...props} />,
  infantryDefence: (props) => (
    <BiShieldQuarter
      {...props}
      className={clsx('text-gray-500', props.className)}
    />
  ),
  cavalryDefence: (props) => (
    <TbHorseshoe
      {...props}
      className={clsx('text-gray-500', props.className)}
    />
  ),
  population: (props) => (
    <FaPeopleGroup
      {...props}
      className={clsx('text-gray-400', props.className)}
    />
  ),
  culturePoints: (props) => (
    <GiGreekTemple
      {...props}
      className={clsx('text-gray-400', props.className)}
    />
  ),
  attack: (props) => (
    <LuSwords
      {...props}
      className={clsx('text-gray-500', props.className)}
    />
  ),
  defence: (props) => (
    <BiShieldQuarter
      {...props}
      className={clsx('text-gray-500', props.className)}
    />
  ),
  defenceBonus: (props) => (
    <BiShieldQuarter
      {...props}
      className={clsx('text-gray-500', props.className)}
    />
  ),
  barracksTrainingDuration: (props) => <LuClock {...props} />,
  greatBarracksTrainingDuration: (props) => <LuClock {...props} />,
  stableTrainingDuration: (props) => <LuClock {...props} />,
  greatStableTrainingDuration: (props) => <LuClock {...props} />,
  workshopTrainingDuration: (props) => <LuClock {...props} />,
  hospitalTrainingDuration: (props) => <LuClock {...props} />,
  unitSpeed: (props) => <TbBrandSpeedtest {...props} />,
  unitCarryCapacity: (props) => (
    <GiSwapBag
      {...props}
      className={clsx('text-gray-500', props.className)}
    />
  ),
  unitWheatConsumption: (props) => icons.wheat(props),
  trapperCapacity: (props) => <GiWolfTrap {...props} />,
  merchantCapacity: (props) => <BsMinecartLoaded {...props} />,
  merchantAmount: (props) => <FaHandshakeAngle {...props} />,
  woodProduction: (props) => icons.wood(props),
  clayProduction: (props) => icons.clay(props),
  ironProduction: (props) => icons.iron(props),
  wheatProduction: (props) => icons.wheat(props),
  unitImprovementDuration: (props) => <LuClock {...props} />,
  unitResearchDuration: (props) => <LuClock {...props} />,
  crannyCapacity: (props) => <PiKeyhole {...props} />,
  revealedIncomingTroopsAmount: (props) => <GiSpyglass {...props} />,
  unitSpeedAfter20Fields: (props) => (
    <GiLeatherBoot
      {...props}
      className={clsx('text-[#3c2f2f]', props.className)}
    />
  ),
  merchantSpeed: (props) => icons.missingIcon(props),

  // Special troops
  hero: (props) => (
    <FaStar
      {...props}
      className={clsx('text-yellow-300', props.className)}
    />
  ),

  // Roman troops
  legionnaire: (props) => <LuSword {...props} />,
  praetorian: (props) => <LuSword {...props} />,
  imperian: (props) => <LuSword {...props} />,
  romanScout: (props) => (
    <PillageFirstHorse
      {...props}
      className={clsx(styles['roman-scout'], props.className)}
    />
  ),
  equitesImperatoris: (props) => (
    <PillageFirstHorse
      {...props}
      className={clsx(styles['equites-imperatoris'], props.className)}
    />
  ),
  equitesCaesaris: (props) => (
    <PillageFirstHorse
      {...props}
      className={clsx(styles['equites-caesaris'], props.className)}
    />
  ),
  romanRam: (props) => <GiIBeam {...props} />,
  romanCatapult: (props) => <PillageFirstCatapult {...props} />,
  romanChief: (props) => (
    <TbLaurelWreath
      {...props}
      className={clsx('text-green-700', props.className)}
    />
  ),
  romanSettler: (props) => (
    <GiPointyHat
      {...props}
      className={clsx('text-red-600', props.className)}
    />
  ),

  // Gaul troops
  phalanx: (props) => icons.missingIcon(props),
  swordsman: (props) => icons.missingIcon(props),
  gaulScout: (props) => (
    <PillageFirstHorse
      {...props}
      className={clsx(styles['gaul-scout'], props.className)}
    />
  ),
  theutatesThunder: (props) => (
    <PillageFirstHorse
      {...props}
      className={clsx(styles['theutates-thunder'], props.className)}
    />
  ),
  druidrider: (props) => (
    <PillageFirstHorse
      {...props}
      className={clsx(styles.druidrider, props.className)}
    />
  ),
  haeduan: (props) => (
    <PillageFirstHorse
      {...props}
      className={clsx(styles.haeduan, props.className)}
    />
  ),
  gaulRam: (props) => icons.missingIcon(props),
  gaulCatapult: (props) => <PillageFirstCatapult {...props} />,
  gaulChief: (props) => (
    <TbLaurelWreath
      {...props}
      className={clsx('text-green-700', props.className)}
    />
  ),
  gaulSettler: (props) => (
    <GiPointyHat
      {...props}
      className={clsx('text-green-700', props.className)}
    />
  ),

  // Teuton troops
  clubswinger: (props) => icons.missingIcon(props),
  spearman: (props) => icons.missingIcon(props),
  axeman: (props) => icons.missingIcon(props),
  teutonicScout: (props) => icons.missingIcon(props),
  paladin: (props) => (
    <PillageFirstHorse
      {...props}
      className={clsx(styles.paladin, props.className)}
    />
  ),
  teutonicKnight: (props) => (
    <PillageFirstHorse
      {...props}
      className={clsx(styles['teutonic-knight'], props.className)}
    />
  ),
  teutonicRam: (props) => icons.missingIcon(props),
  teutonicCatapult: (props) => <PillageFirstCatapult {...props} />,
  teutonicChief: (props) => (
    <TbLaurelWreath
      {...props}
      className={clsx('text-green-700', props.className)}
    />
  ),
  teutonicSettler: (props) => (
    <GiPointyHat
      {...props}
      className={clsx('text-red-500', props.className)}
    />
  ),

  // Egyptian troops
  slaveMilitia: (props) => icons.missingIcon(props),
  ashWarden: (props) => icons.missingIcon(props),
  khopeshWarrior: (props) => icons.missingIcon(props),
  egyptianScout: (props) => (
    <PillageFirstHorse
      {...props}
      className={clsx(styles['egyptian-scout'], props.className)}
    />
  ),
  anhurGuard: (props) => (
    <PillageFirstHorse
      {...props}
      className={clsx(styles['anhur-guard'], props.className)}
    />
  ),
  reshephChariot: (props) => (
    <PillageFirstHorse
      {...props}
      className={clsx(styles['resheph-chariot'], props.className)}
    />
  ),
  egyptianRam: (props) => icons.missingIcon(props),
  egyptianCatapult: (props) => <PillageFirstCatapult {...props} />,
  egyptianChief: (props) => (
    <TbLaurelWreath
      {...props}
      className={clsx('text-green-700', props.className)}
    />
  ),
  egyptianSettler: (props) => (
    <GiPointyHat
      {...props}
      className={clsx('text-yellow-600', props.className)}
    />
  ),

  // Hun troops
  mercenary: (props) => icons.missingIcon(props),
  bowman: (props) => icons.missingIcon(props),
  hunScout: (props) => icons.missingIcon(props),
  steppeRider: (props) => (
    <PillageFirstHorse
      {...props}
      className={clsx(styles['steppe-rider'], props.className)}
    />
  ),
  marksman: (props) => (
    <PillageFirstHorse
      {...props}
      className={clsx(styles.marksman, props.className)}
    />
  ),
  marauder: (props) => (
    <PillageFirstHorse
      {...props}
      className={clsx(styles.marauder, props.className)}
    />
  ),
  hunRam: (props) => icons.missingIcon(props),
  hunCatapult: (props) => <PillageFirstCatapult {...props} />,
  hunChief: (props) => (
    <TbLaurelWreath
      {...props}
      className={clsx('text-green-700', props.className)}
    />
  ),
  hunSettler: (props) => (
    <GiPointyHat
      {...props}
      className={clsx('text-yellow-800', props.className)}
    />
  ),

  // Natarian troops
  pikeman: (props) => icons.missingIcon(props),
  thornedWarrior: (props) => icons.missingIcon(props),
  guardsman: (props) => icons.missingIcon(props),
  axerider: (props) => (
    <PillageFirstHorse
      {...props}
      className={clsx(styles[''], props.className)}
    />
  ),
  natarianScout: (props) => icons.missingIcon(props),
  natarianKnight: (props) => (
    <PillageFirstHorse
      {...props}
      className={clsx(styles[''], props.className)}
    />
  ),
  natarianRam: (props) => icons.missingIcon(props),
  natarianCatapult: (props) => <PillageFirstCatapult {...props} />,
  natarianChief: (props) => (
    <TbLaurelWreath
      {...props}
      className={clsx('text-green-700', props.className)}
    />
  ),
  natarianSettler: (props) => (
    <GiPointyHat
      {...props}
      className={clsx('text-stone-950', props.className)}
    />
  ),

  // Nature
  rat: (props) => (
    <GiRat
      {...props}
      className={clsx('text-[#4B3C39]', props.className)}
    />
  ),
  spider: (props) => (
    <FaSpider
      {...props}
      className={clsx('text-[#D3C2A3]', props.className)}
    />
  ),
  serpent: (props) => (
    <GiSandSnake
      {...props}
      className={clsx('text-[#B8B62F]', props.className)}
    />
  ),
  bat: (props) => (
    <TbBat
      {...props}
      className={clsx('text-[#545151]', props.className)}
    />
  ),
  wildBoar: (props) => (
    <GiBoar
      {...props}
      className={clsx('text-[#5A3929]', props.className)}
    />
  ),
  wolf: (props) => (
    <GiWolfHead
      {...props}
      className={clsx('text-[#727C83]', props.className)}
    />
  ),
  bear: (props) => (
    <GiBearHead
      {...props}
      className={clsx('text-[#836852]', props.className)}
    />
  ),
  crocodile: (props) => (
    <GiCrocJaws
      {...props}
      className={clsx('text-[#4da167]', props.className)}
    />
  ),
  tiger: (props) => (
    <GiSaberToothedCatHead
      {...props}
      className={clsx('text-[#D49C4A]', props.className)}
    />
  ),
  elephant: (props) => <GiElephant {...props} />,

  // Troop movements
  deploymentOutgoing: (props) => (
    <BsShieldFill
      {...props}
      className={clsx('text-yellow-300', props.className)}
    />
  ),
  deploymentIncoming: (props) => (
    <BsShieldFill
      {...props}
      className={clsx('text-green-600', props.className)}
    />
  ),
  offensiveMovementOutgoing: (props) => (
    <LuSwords
      {...props}
      className={clsx('text-yellow-300', props.className)}
    />
  ),
  offensiveMovementIncoming: (props) => (
    <LuSwords
      {...props}
      className={clsx('text-red-500', props.className)}
    />
  ),
  adventure: (props) => (
    <PiPath
      {...props}
      className={clsx('text-blue-500', props.className)}
    />
  ),
  findNewVillage: (props) => (
    <GiPointyHat
      {...props}
      className={clsx('text-blue-500', props.className)}
    />
  ),

  // Hero
  heroRevivalDuration: (props) => <CgTimelapse {...props} />,
};

export const unitIdToUnitIconMapper = (unitId: Unit['id']): UnitIconType => {
  return camelCase(unitId) as UnitIconType;
};
