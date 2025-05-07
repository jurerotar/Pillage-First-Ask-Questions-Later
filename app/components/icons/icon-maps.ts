import type { Effect } from 'app/interfaces/models/game/effect';
import type {
  EgyptianUnitId,
  GaulUnitId,
  HunUnitId,
  NatarUnitId,
  NatureUnitId,
  RomanUnitId,
  TeutonUnitId,
} from 'app/interfaces/models/game/unit';
import type { UpperCaseToCamelCase } from 'app/utils/typescript';
import type React from 'react';
import { lazy } from 'react';

const IconMissingIcon = lazy(async () => ({ default: (await import('app/components/icons/icon-missing-icon')).IconMissingIcon }));

// Common
const IconCancel = lazy(async () => ({ default: (await import('app/components/icons/common/icon-cancel')).IconCancel }));

// Resources
const IconResourceWheat = lazy(async () => ({ default: (await import('app/components/icons/resources/icon-wheat')).IconWheat }));
const IconResourceIron = lazy(async () => ({ default: (await import('app/components/icons/resources/icon-iron')).IconIron }));
const IconResourceWood = lazy(async () => ({ default: (await import('app/components/icons/resources/icon-wood')).IconWood }));
const IconResourceClay = lazy(async () => ({ default: (await import('app/components/icons/resources/icon-clay')).IconClay }));

// Resource combinations
const IconResourceCombinationWoodWheat = lazy(async () => ({
  default: (await import('app/components/icons/resource-combinations/icon-wood')).IconWood,
}));
const IconResourceCombinationIronWheat = lazy(async () => ({
  default: (await import('app/components/icons/resource-combinations/icon-iron')).IconIron,
}));
const IconResourceCombinationClayWheat = lazy(async () => ({
  default: (await import('app/components/icons/resource-combinations/icon-clay')).IconClay,
}));
const IconResourceCombinationWoodWood = lazy(async () => ({
  default: (await import('app/components/icons/resource-combinations/icon-wood')).IconWood,
}));
const IconResourceCombinationIronIron = lazy(async () => ({
  default: (await import('app/components/icons/resource-combinations/icon-iron')).IconIron,
}));
const IconResourceCombinationClayClay = lazy(async () => ({
  default: (await import('app/components/icons/resource-combinations/icon-clay')).IconClay,
}));
const IconResourceCombinationWheatWheat = lazy(async () => ({
  default: (await import('app/components/icons/resource-combinations/icon-wheat')).IconWheat,
}));

// Map controls
const IconMapMagnificationIncrease = lazy(async () => ({
  default: (await import('app/components/icons/map-controls/icon-map-magnification-increase')).IconMapMagnificationIncrease,
}));
const IconMapMagnificationDecrease = lazy(async () => ({
  default: (await import('app/components/icons/map-controls/icon-map-magnification-decrease')).IconMapMagnificationDecrease,
}));
const IconMapReputationToggle = lazy(async () => ({
  default: (await import('app/components/icons/map-controls/icon-map-reputation-toggle')).IconMapReputationToggle,
}));
const IconMapOasisIconsToggle = lazy(async () => ({
  default: (await import('app/components/icons/map-controls/icon-map-oasis-icons-toggle')).IconMapOasisIconsToggle,
}));
const IconMapTroopMovementsToggle = lazy(async () => ({
  default: (await import('app/components/icons/map-controls/icon-map-troop-movements-toggle')).IconMapTroopMovementsToggle,
}));
const IconMapWheatFieldIconToggle = lazy(async () => ({
  default: (await import('app/components/icons/map-controls/icon-map-wheat-field-icon-toggle')).IconMapWheatFieldIconToggle,
}));
const IconMapTileTooltipToggle = lazy(async () => ({
  default: (await import('app/components/icons/map-controls/icon-map-tile-tooltip-toggle')).IconMapTileTooltipToggle,
}));
const IconMapTreasuresToggle = lazy(async () => ({
  default: (await import('app/components/icons/map-controls/icon-map-treasures-toggle')).IconMapTreasuresToggle,
}));

// Map occupied tile icons
const IconTreasureTileItem = lazy(async () => ({
  default: (await import('app/components/icons/treasure-tile/icon-treasure-tile-item')).IconTreasureTileItem,
}));
const IconTreasureTileResources = lazy(async () => ({
  default: (await import('app/components/icons/treasure-tile/icon-treasure-tile-resources')).IconTreasureTileResources,
}));
const IconTreasureTileArtifact = lazy(async () => ({
  default: (await import('app/components/icons/treasure-tile/icon-treasure-tile-artifact')).IconTreasureTileArtifact,
}));
const IconTreasureTileCurrency = lazy(async () => ({
  default: (await import('app/components/icons/treasure-tile/icon-treasure-tile-currency')).IconTreasureTileCurrency,
}));
const IconTreasureTileMiscellaneous = lazy(async () => ({
  default: (await import('app/components/icons/treasure-tile/icon-treasure-tile-miscellaneous')).IconTreasureTileMiscellaneous,
}));

// Troop movements
const IconTroopMovementDeploymentOutgoing = lazy(async () => ({
  default: (await import('app/components/icons/troop-movements/icon-deployment-outgoing')).IconDeploymentOutgoing,
}));
const IconTroopMovementDeploymentIncoming = lazy(async () => ({
  default: (await import('app/components/icons/troop-movements/icon-deployment-incoming')).IconDeploymentIncoming,
}));
const IconTroopMovementOffensiveMovementOutgoing = lazy(async () => ({
  default: (await import('app/components/icons/troop-movements/icon-offensive-movement-outgoing')).IconOffensiveMovementOutgoing,
}));
const IconTroopMovementOffensiveMovementIncoming = lazy(async () => ({
  default: (await import('app/components/icons/troop-movements/icon-offensive-movement-incoming')).IconOffensiveMovementIncoming,
}));
const IconTroopMovementAdventure = lazy(async () => ({
  default: (await import('app/components/icons/troop-movements/icon-adventure')).IconAdventure,
}));
const IconTroopMovementFindNewVillage = lazy(async () => ({
  default: (await import('app/components/icons/troop-movements/icon-find-new-village')).IconFindNewVillage,
}));

// Report icons
const IconAttackerNoLoss = lazy(async () => ({
  default: (await import('app/components/icons/report/icon-attacker-no-loss')).IconAttackerNoLoss,
}));
const IconAttackerSomeLoss = lazy(async () => ({
  default: (await import('app/components/icons/report/icon-attacker-some-loss')).IconAttackerSomeLoss,
}));
const IconAttackerFullLoss = lazy(async () => ({
  default: (await import('app/components/icons/report/icon-attacker-full-loss')).IconAttackerNoLoss,
}));
const IconDefenderNoLoss = lazy(async () => ({
  default: (await import('app/components/icons/report/icon-defender-no-loss')).IconDefenderNoLoss,
}));
const IconDefenderSomeLoss = lazy(async () => ({
  default: (await import('app/components/icons/report/icon-defender-some-loss')).IconDefenderSomeLoss,
}));
const IconDefenderFullLoss = lazy(async () => ({
  default: (await import('app/components/icons/report/icon-defender-full-loss')).IconDefenderFullLoss,
}));

// Building field
const IconBuildingDuration = lazy(async () => ({
  default: (await import('app/components/icons/effects/icon-building-duration')).IconBuildingDuration,
}));

// Effects
const IconWarehouseCapacity = lazy(async () => ({
  default: (await import('app/components/icons/effects/icon-warehouse-capacity')).IconWarehouseCapacity,
}));
const IconGranaryCapacity = lazy(async () => ({
  default: (await import('app/components/icons/effects/icon-granary-capacity')).IconGranaryCapacity,
}));
const IconFreeCrop = lazy(async () => ({
  default: (await import('app/components/icons/effects/icon-free-crop')).IconFreeCrop,
}));
const IconCavalryDefence = lazy(async () => ({
  default: (await import('app/components/icons/effects/icon-cavalry-defence')).IconCavalryDefence,
}));
const IconInfantryDefence = lazy(async () => ({
  default: (await import('app/components/icons/effects/icon-infantry-defence')).IconInfantryDefence,
}));
const IconPopulation = lazy(async () => ({
  default: (await import('app/components/icons/effects/icon-population')).IconPopulation,
}));
const IconAttack = lazy(async () => ({
  default: (await import('app/components/icons/effects/icon-attack')).IconAttack,
}));
const IconTroopBuildingDuration = lazy(async () => ({
  default: (await import('app/components/icons/effects/icon-troop-building-duration')).IconTroopBuildingDuration,
}));
const IconUnitSpeed = lazy(async () => ({
  default: (await import('app/components/icons/effects/icon-unit-speed')).IconUnitSpeed,
}));
const IconUnitCarryCapacity = lazy(async () => ({
  default: (await import('app/components/icons/effects/icon-unit-carry-capacity')).IconUnitCarryCapacity,
}));
const IconUnitWheatConsumption = lazy(async () => ({
  default: (await import('app/components/icons/effects/icon-unit-wheat-consumption')).IconUnitWheatConsumption,
}));
const IconTrapperCapacity = lazy(async () => ({
  default: (await import('app/components/icons/effects/icon-trapper-capacity')).IconTrapperCapacity,
}));
const IconMerchantCapacity = lazy(async () => ({
  default: (await import('app/components/icons/effects/icon-merchant-capacity')).IconMerchantCapacity,
}));
const IconCrannyCapacity = lazy(async () => ({
  default: (await import('app/components/icons/effects/icon-cranny-capacity')).IconCrannyCapacity,
}));
const IconRevealedIncomingTroopsAmount = lazy(async () => ({
  default: (await import('app/components/icons/effects/icon-revealed-incoming-troops-amount')).IconRevealedIncomingTroopsAmount,
}));

// Village
const IconPopulationCropConsumption = lazy(async () => ({
  default: (await import('app/components/icons/village/icon-population-crop-consumption')).IconPopulationCropConsumption,
}));
const IconTroopsCropConsumption = lazy(async () => ({
  default: (await import('app/components/icons/village/icon-troops-crop-consumption')).IconTroopsCropConsumption,
}));

// Roman troops
const IconUnitRomansLegionnaire = lazy(async () => ({
  default: (await import('app/components/icons/troops/romans/icon-legionnaire')).IconLegionnaire,
}));
const IconUnitRomansPraetorian = lazy(async () => ({
  default: (await import('app/components/icons/troops/romans/icon-praetorian')).IconPraetorian,
}));
const IconUnitRomansImperian = lazy(async () => ({
  default: (await import('app/components/icons/troops/romans/icon-imperian')).IconImperian,
}));
const IconUnitRomansRomanScout = lazy(async () => ({
  default: (await import('app/components/icons/troops/romans/icon-roman-scout')).IconRomanScout,
}));
const IconUnitRomansEquitesImperatoris = lazy(async () => ({
  default: (await import('app/components/icons/troops/romans/icon-equites-imperatoris')).IconEquitesImperatoris,
}));
const IconUnitRomansEquitesCaesaris = lazy(async () => ({
  default: (await import('app/components/icons/troops/romans/icon-equites-caesaris')).IconEquitesCaesaris,
}));
const IconUnitRomansRomanRam = lazy(async () => ({
  default: (await import('app/components/icons/troops/romans/icon-roman-ram')).IconRomanRam,
}));
const IconUnitRomansRomanCatapult = lazy(async () => ({
  default: (await import('app/components/icons/troops/romans/icon-roman-catapult')).IconRomanCatapult,
}));
const IconUnitRomansChief = lazy(async () => ({
  default: (await import('app/components/icons/troops/romans/icon-roman-chief')).IconRomanChief,
}));
const IconUnitRomansRomanSettler = lazy(async () => ({
  default: (await import('app/components/icons/troops/romans/icon-roman-settler')).IconRomanSettler,
}));

// Gaul troops
const IconUnitGaulsPhalanx = lazy(async () => ({
  default: (await import('app/components/icons/troops/gauls/icon-phalanx')).IconPhalanx,
}));
const IconUnitGaulsSwordsman = lazy(async () => ({
  default: (await import('app/components/icons/troops/gauls/icon-swordsman')).IconSwordsman,
}));
const IconUnitGaulsGaulScout = lazy(async () => ({
  default: (await import('app/components/icons/troops/gauls/icon-gaul-scout')).IconGaulScout,
}));
const IconUnitGaulsTheutatesThunder = lazy(async () => ({
  default: (await import('app/components/icons/troops/gauls/icon-theutates-thunder')).IconTheutatesThunder,
}));
const IconUnitGaulsDruidrider = lazy(async () => ({
  default: (await import('app/components/icons/troops/gauls/icon-druidrider')).IconDruidrider,
}));
const IconUnitGaulsHaeduan = lazy(async () => ({
  default: (await import('app/components/icons/troops/gauls/icon-haeduan')).IconHaeduan,
}));
const IconUnitGaulGaulRam = lazy(async () => ({
  default: (await import('app/components/icons/troops/gauls/icon-gaul-ram')).IconGaulRam,
}));
const IconUnitGaulGaulCatapult = lazy(async () => ({
  default: (await import('app/components/icons/troops/gauls/icon-gaul-catapult')).IconGaulCatapult,
}));
const IconUnitGaulGaulChief = lazy(async () => ({
  default: (await import('app/components/icons/troops/gauls/icon-gaul-chief')).IconGaulChief,
}));
const IconUnitGaulGaulSettler = lazy(async () => ({
  default: (await import('app/components/icons/troops/gauls/icon-gaul-settler')).IconGaulSettler,
}));

// Teuton troops
const IconUnitTeutonsTeutonicScout = lazy(async () => ({
  default: (await import('app/components/icons/troops/teutons/icon-teutonic-scout')).IconTeutonicScout,
}));
const IconUnitTeutonsPaladin = lazy(async () => ({
  default: (await import('app/components/icons/troops/teutons/icon-paladin')).IconPaladin,
}));
const IconUnitTeutonsTeutonicKnight = lazy(async () => ({
  default: (await import('app/components/icons/troops/teutons/icon-teutonic-knight')).IconTeutonicKnight,
}));
const IconUnitTeutonsTeutonicRam = lazy(async () => ({
  default: (await import('app/components/icons/troops/teutons/icon-teutonic-ram')).IconTeutonicRam,
}));
const IconUnitTeutonsTeutonicCatapult = lazy(async () => ({
  default: (await import('app/components/icons/troops/teutons/icon-teutonic-catapult')).IconTeutonicCatapult,
}));
const IconUnitTeutonsTeutonicChief = lazy(async () => ({
  default: (await import('app/components/icons/troops/teutons/icon-teutonic-chief')).IconTeutonicChief,
}));
const IconUnitTeutonsTeutonicSettler = lazy(async () => ({
  default: (await import('app/components/icons/troops/teutons/icon-teutonic-settler')).IconTeutonicSettler,
}));

// Egyptian troops
const IconUnitEgyptiansEgyptianScout = lazy(async () => ({
  default: (await import('app/components/icons/troops/egyptians/icon-egyptian-scout')).IconEgyptianScout,
}));
const IconUnitEgyptiansAnhurGuard = lazy(async () => ({
  default: (await import('app/components/icons/troops/egyptians/icon-anhur-guard')).IconAnhurGuard,
}));
const IconUnitEgyptiansReshephChariot = lazy(async () => ({
  default: (await import('app/components/icons/troops/egyptians/icon-resheph-chariot')).IconReshephChariot,
}));
const IconUnitEgyptiansEgyptianRam = lazy(async () => ({
  default: (await import('app/components/icons/troops/egyptians/icon-egyptian-ram')).IconEgyptianRam,
}));
const IconUnitEgyptiansEgyptianCatapult = lazy(async () => ({
  default: (await import('app/components/icons/troops/egyptians/icon-egyptian-catapult')).IconEgyptianCatapult,
}));
const IconUnitEgyptiansEgyptianChief = lazy(async () => ({
  default: (await import('app/components/icons/troops/egyptians/icon-egyptian-chief')).IconEgyptianChief,
}));
const IconUnitEgyptiansEgyptianSettler = lazy(async () => ({
  default: (await import('app/components/icons/troops/egyptians/icon-egyptian-settler')).IconEgyptianSettler,
}));

// Hun troops
const IconUnitHunHunScout = lazy(async () => ({
  default: (await import('app/components/icons/troops/huns/icon-hun-scout')).IconHunScout,
}));
const IconUnitHunSteppeRider = lazy(async () => ({
  default: (await import('app/components/icons/troops/huns/icon-steppe-rider')).IconSteppeRider,
}));
const IconUnitHunMarksman = lazy(async () => ({
  default: (await import('app/components/icons/troops/huns/icon-marksman')).IconMarksman,
}));
const IconUnitHunMarauder = lazy(async () => ({
  default: (await import('app/components/icons/troops/huns/icon-marauder')).IconMarauder,
}));
const IconUnitHunHunRam = lazy(async () => ({
  default: (await import('app/components/icons/troops/huns/icon-hun-ram')).IconHunRam,
}));
const IconUnitHunHunCatapult = lazy(async () => ({
  default: (await import('app/components/icons/troops/huns/icon-hun-catapult')).IconHunCatapult,
}));
const IconUnitHunHunChief = lazy(async () => ({
  default: (await import('app/components/icons/troops/huns/icon-hun-chief')).IconHunChief,
}));
const IconUnitHunHunSettler = lazy(async () => ({
  default: (await import('app/components/icons/troops/huns/icon-hun-settler')).IconHunSettler,
}));

// Natarian troops
const IconUnitNatarNatarianScout = lazy(async () => ({
  default: (await import('app/components/icons/troops/natars/icon-natarian-scout')).IconNatarianScout,
}));
const IconUnitNatarAxerider = lazy(async () => ({
  default: (await import('app/components/icons/troops/natars/icon-axerider')).IconAxerider,
}));
const IconUnitNatarNatarianKnight = lazy(async () => ({
  default: (await import('app/components/icons/troops/natars/icon-natarian-knight')).IconNatarianKnight,
}));
const IconUnitNatarNatarianRam = lazy(async () => ({
  default: (await import('app/components/icons/troops/natars/icon-natarian-ram')).IconNatarianRam,
}));
const IconUnitNatarNatarianCatapult = lazy(async () => ({
  default: (await import('app/components/icons/troops/natars/icon-natarian-catapult')).IconNatarianCatapult,
}));
const IconUnitNatarNatarianChief = lazy(async () => ({
  default: (await import('app/components/icons/troops/natars/icon-natarian-chief')).IconNatarianChief,
}));
const IconUnitNatarNatarianSettler = lazy(async () => ({
  default: (await import('app/components/icons/troops/natars/icon-natarian-settler')).IconNatarianSettler,
}));

// Nature troops
const IconUnitNatureRat = lazy(async () => ({
  default: (await import('app/components/icons/troops/nature/icon-rat')).IconRat,
}));
const IconUnitNatureSpider = lazy(async () => ({
  default: (await import('app/components/icons/troops/nature/icon-spider')).IconSpider,
}));
const IconUnitNatureSerpent = lazy(async () => ({
  default: (await import('app/components/icons/troops/nature/icon-serpent')).IconSerpent,
}));
const IconUnitNatureBat = lazy(async () => ({
  default: (await import('app/components/icons/troops/nature/icon-bat')).IconBat,
}));
const IconUnitNatureWildBoar = lazy(async () => ({
  default: (await import('app/components/icons/troops/nature/icon-wild-boar')).IconWildBoar,
}));
const IconUnitNatureWolf = lazy(async () => ({
  default: (await import('app/components/icons/troops/nature/icon-wolf')).IconWolf,
}));
const IconUnitNatureBear = lazy(async () => ({
  default: (await import('app/components/icons/troops/nature/icon-bear')).IconBear,
}));
const IconUnitNatureCrocodile = lazy(async () => ({
  default: (await import('app/components/icons/troops/nature/icon-crocodile')).IconCrocodile,
}));
const IconUnitNatureTiger = lazy(async () => ({
  default: (await import('app/components/icons/troops/nature/icon-tiger')).IconTiger,
}));
const IconUnitNatureElephant = lazy(async () => ({
  default: (await import('app/components/icons/troops/nature/icon-elephant')).IconElephant,
}));

export type MissingIconType = 'missingIcon';

export type ReportIconType =
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

type MapAdventureIconType = 'adventureDifficult' | 'adventureNormal';

type CommonIconType = 'cancel';

export type TreasureTileIconType =
  | 'treasureTileItem'
  | 'treasureTileResources'
  | 'treasureTileArtifact'
  | 'treasureTileCurrency'
  | 'treasureTileMiscellaneous';

export type ResourceCombinationIconType = 'woodWheat' | 'clayWheat' | 'ironWheat' | 'woodWood' | 'clayClay' | 'ironIron' | 'wheatWheat';

type ResourceIconType = 'wood' | 'clay' | 'iron' | 'wheat';

type VillageIconType = 'populationCropConsumption' | 'troopsCropConsumption';

type RomanTroopIconType = UpperCaseToCamelCase<RomanUnitId>;

type GaulTroopIconType = UpperCaseToCamelCase<GaulUnitId>;

type TeutonTroopIconType = UpperCaseToCamelCase<TeutonUnitId>;

type HunTroopIconType = UpperCaseToCamelCase<HunUnitId>;

type EgyptianTroopIconType = UpperCaseToCamelCase<EgyptianUnitId>;

type NatarTroopIconType = UpperCaseToCamelCase<NatarUnitId>;

type NatureTroopIconType = UpperCaseToCamelCase<NatureUnitId>;

type UnitAttributeType = 'carryCapacity' | 'unitSpeed';

type TroopMovementType =
  | 'deploymentOutgoing'
  | 'deploymentIncoming'
  | 'offensiveMovementOutgoing'
  | 'offensiveMovementIncoming'
  | 'adventure'
  | 'findNewVillage';

export type UnitIconType =
  | RomanTroopIconType
  | GaulTroopIconType
  | TeutonTroopIconType
  | HunTroopIconType
  | EgyptianTroopIconType
  | NatarTroopIconType
  | NatureTroopIconType;

type OtherIconType = 'freeCrop' | 'population';

export type IconType =
  | MissingIconType
  | CommonIconType
  | UnitAttributeType
  | ReportIconType
  | ResourceCombinationIconType
  | ResourceIconType
  | MapControlsIconType
  | TreasureTileIconType
  | VillageIconType
  | UnitIconType
  | MapAdventureIconType
  | OtherIconType
  | TroopMovementType
  | Effect['id'];

// @ts-ignore - TODO: Add missing icons
export const typeToIconMap: Record<IconType, React.LazyExoticComponent<() => React.JSX.Element>> = {
  missingIcon: IconMissingIcon,

  // Resources
  wood: IconResourceWood,
  clay: IconResourceClay,
  iron: IconResourceIron,
  wheat: IconResourceWheat,
  woodWheat: IconResourceCombinationWoodWheat,
  clayWheat: IconResourceCombinationClayWheat,
  ironWheat: IconResourceCombinationIronWheat,
  woodWood: IconResourceCombinationWoodWood,
  clayClay: IconResourceCombinationClayClay,
  ironIron: IconResourceCombinationIronIron,
  wheatWheat: IconResourceCombinationWheatWheat,

  // Map controls
  mapMagnificationIncrease: IconMapMagnificationIncrease,
  mapMagnificationDecrease: IconMapMagnificationDecrease,
  mapReputationToggle: IconMapReputationToggle,
  mapOasisIconsToggle: IconMapOasisIconsToggle,
  mapTroopMovementsToggle: IconMapTroopMovementsToggle,
  mapWheatFieldIconToggle: IconMapWheatFieldIconToggle,
  mapTileTooltipToggle: IconMapTileTooltipToggle,
  mapTreasureIconToggle: IconMapTreasuresToggle,

  // Map treasures
  treasureTileItem: IconTreasureTileItem,
  treasureTileResources: IconTreasureTileResources,
  treasureTileArtifact: IconTreasureTileArtifact,
  treasureTileCurrency: IconTreasureTileCurrency,
  treasureTileMiscellaneous: IconTreasureTileMiscellaneous,

  // Reports
  attackerNoLoss: IconAttackerNoLoss,
  attackerSomeLoss: IconAttackerSomeLoss,
  attackerFullLoss: IconAttackerFullLoss,
  defenderNoLoss: IconDefenderNoLoss,
  defenderSomeLoss: IconDefenderSomeLoss,
  defenderFullLoss: IconDefenderFullLoss,

  // Effects
  freeCrop: IconFreeCrop,
  populationCropConsumption: IconPopulationCropConsumption,
  troopsCropConsumption: IconTroopsCropConsumption,
  warehouseCapacity: IconWarehouseCapacity,
  granaryCapacity: IconGranaryCapacity,
  buildingDuration: IconBuildingDuration,
  infantryDefence: IconInfantryDefence,
  cavalryDefence: IconCavalryDefence,
  population: IconPopulation,
  attack: IconAttack,
  barracksTrainingDuration: IconTroopBuildingDuration,
  greatBarracksTrainingDuration: IconTroopBuildingDuration,
  stableTrainingDuration: IconTroopBuildingDuration,
  greatStableTrainingDuration: IconTroopBuildingDuration,
  workshopTrainingDuration: IconTroopBuildingDuration,
  hospitalTrainingDuration: IconTroopBuildingDuration,
  unitSpeed: IconUnitSpeed,
  unitCarryCapacity: IconUnitCarryCapacity,
  unitWheatConsumption: IconUnitWheatConsumption,
  trapperCapacity: IconTrapperCapacity,
  merchantCapacity: IconMerchantCapacity,
  woodProduction: IconResourceWood,
  clayProduction: IconResourceClay,
  ironProduction: IconResourceIron,
  wheatProduction: IconResourceWheat,
  crannyCapacity: IconCrannyCapacity,
  revealedIncomingTroopsAmount: IconRevealedIncomingTroopsAmount,

  // Roman troops
  legionnaire: IconUnitRomansLegionnaire,
  praetorian: IconUnitRomansPraetorian,
  imperian: IconUnitRomansImperian,
  romanScout: IconUnitRomansRomanScout,
  equitesImperatoris: IconUnitRomansEquitesImperatoris,
  equitesCaesaris: IconUnitRomansEquitesCaesaris,
  romanRam: IconUnitRomansRomanRam,
  romanCatapult: IconUnitRomansRomanCatapult,
  romanChief: IconUnitRomansChief,
  romanSettler: IconUnitRomansRomanSettler,

  // Gaul troops
  phalanx: IconUnitGaulsPhalanx,
  swordsman: IconUnitGaulsSwordsman,
  gaulScout: IconUnitGaulsGaulScout,
  theutatesThunder: IconUnitGaulsTheutatesThunder,
  druidrider: IconUnitGaulsDruidrider,
  haeduan: IconUnitGaulsHaeduan,
  gaulRam: IconUnitGaulGaulRam,
  gaulCatapult: IconUnitGaulGaulCatapult,
  gaulChief: IconUnitGaulGaulChief,
  gaulSettler: IconUnitGaulGaulSettler,

  // Teuton troops
  teutonicScout: IconUnitTeutonsTeutonicScout,
  paladin: IconUnitTeutonsPaladin,
  teutonicKnight: IconUnitTeutonsTeutonicKnight,
  teutonicRam: IconUnitTeutonsTeutonicRam,
  teutonicCatapult: IconUnitTeutonsTeutonicCatapult,
  teutonicChief: IconUnitTeutonsTeutonicChief,
  teutonicSettler: IconUnitTeutonsTeutonicSettler,

  // Egyptian troops
  egyptianScout: IconUnitEgyptiansEgyptianScout,
  anhurGuard: IconUnitEgyptiansAnhurGuard,
  reshephChariot: IconUnitEgyptiansReshephChariot,
  egyptianRam: IconUnitEgyptiansEgyptianRam,
  egyptianCatapult: IconUnitEgyptiansEgyptianCatapult,
  egyptianChief: IconUnitEgyptiansEgyptianChief,
  egyptianSettler: IconUnitEgyptiansEgyptianSettler,

  // Hun troops
  hunScout: IconUnitHunHunScout,
  steppeRider: IconUnitHunSteppeRider,
  marksman: IconUnitHunMarksman,
  marauder: IconUnitHunMarauder,
  hunRam: IconUnitHunHunRam,
  hunCatapult: IconUnitHunHunCatapult,
  hunChief: IconUnitHunHunChief,
  hunSettler: IconUnitHunHunSettler,

  // Natarian troops
  axerider: IconUnitNatarAxerider,
  natarianScout: IconUnitNatarNatarianScout,
  natarianKnight: IconUnitNatarNatarianKnight,
  natarianRam: IconUnitNatarNatarianRam,
  natarianCatapult: IconUnitNatarNatarianCatapult,
  natarianChief: IconUnitNatarNatarianChief,
  natarianSettler: IconUnitNatarNatarianSettler,

  // Nature
  rat: IconUnitNatureRat,
  spider: IconUnitNatureSpider,
  serpent: IconUnitNatureSerpent,
  bat: IconUnitNatureBat,
  wildBoar: IconUnitNatureWildBoar,
  wolf: IconUnitNatureWolf,
  bear: IconUnitNatureBear,
  crocodile: IconUnitNatureCrocodile,
  tiger: IconUnitNatureTiger,
  elephant: IconUnitNatureElephant,

  // Troop movements
  deploymentOutgoing: IconTroopMovementDeploymentOutgoing,
  deploymentIncoming: IconTroopMovementDeploymentIncoming,
  offensiveMovementOutgoing: IconTroopMovementOffensiveMovementOutgoing,
  offensiveMovementIncoming: IconTroopMovementOffensiveMovementIncoming,
  adventure: IconTroopMovementAdventure,
  findNewVillage: IconTroopMovementFindNewVillage,

  // Common
  cancel: IconCancel,
};
