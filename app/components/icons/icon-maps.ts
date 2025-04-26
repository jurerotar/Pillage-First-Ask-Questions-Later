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
import type { PickLiteral, UpperCaseToCamelCase } from 'app/utils/typescript';
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

// Map adventure tile icons
const IconAdventureDifficult = lazy(async () => ({
  default: (await import('app/components/icons/adventure/icon-adventure-difficult')).IconAdventureDifficult,
}));
const IconAdventureNormal = lazy(async () => ({
  default: (await import('app/components/icons/adventure/icon-adventure-normal')).IconAdventureNormal,
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
  default: (await import('app/components/icons/building-field/icon-building-duration')).IconBuildingDuration,
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
const IconUnitRomansEquitesLegati = lazy(async () => ({
  default: (await import('app/components/icons/troops/romans/icon-equites-legati')).IconEquitesLegati,
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
const IconUnitRomansSenator = lazy(async () => ({
  default: (await import('app/components/icons/troops/romans/icon-senator')).IconSenator,
}));
const IconUnitRomansRomanSettler = lazy(async () => ({
  default: (await import('app/components/icons/troops/romans/icon-roman-settler')).IconRomanSettler,
}));

// Gaul troops
const IconUnitGaulsPathfinder = lazy(async () => ({
  default: (await import('app/components/icons/troops/gauls/icon-pathfinder')).IconPathfinder,
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
const IconUnitGaulGaulCatapult = lazy(async () => ({
  default: (await import('app/components/icons/troops/gauls/icon-gaul-catapult')).IconGaulCatapult,
}));

// Teuton troops
const IconUnitTeutonsPaladin = lazy(async () => ({
  default: (await import('app/components/icons/troops/teutons/icon-paladin')).IconPaladin,
}));
const IconUnitTeutonsTeutonicKnight = lazy(async () => ({
  default: (await import('app/components/icons/troops/teutons/icon-teutonic-knight')).IconTeutonicKnight,
}));
const IconUnitTeutonsTeutonicCatapult = lazy(async () => ({
  default: (await import('app/components/icons/troops/teutons/icon-teutonic-catapult')).IconTeutonicCatapult,
}));

// Egyptian troops
const IconUnitEgyptiansSopduExplorer = lazy(async () => ({
  default: (await import('app/components/icons/troops/egyptians/icon-sopdu-explorer')).IconSopduExplorer,
}));
const IconUnitEgyptiansAnhurGuard = lazy(async () => ({
  default: (await import('app/components/icons/troops/egyptians/icon-anhur-guard')).IconAnhurGuard,
}));
const IconUnitEgyptiansReshephChariot = lazy(async () => ({
  default: (await import('app/components/icons/troops/egyptians/icon-resheph-chariot')).IconReshephChariot,
}));
const IconUnitEgyptiansEgyptianCatapult = lazy(async () => ({
  default: (await import('app/components/icons/troops/egyptians/icon-egyptian-catapult')).IconEgyptianCatapult,
}));

// Hun troops
const IconUnitHunSpotter = lazy(async () => ({
  default: (await import('app/components/icons/troops/huns/icon-spotter')).IconSpotter,
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
const IconUnitHunHunCatapult = lazy(async () => ({
  default: (await import('app/components/icons/troops/huns/icon-hun-catapult')).IconHunCatapult,
}));

// Natar troops
const IconUnitNatarAxerider = lazy(async () => ({
  default: (await import('app/components/icons/troops/natars/icon-axerider')).IconAxerider,
}));
const IconUnitNatarNatarianKnight = lazy(async () => ({
  default: (await import('app/components/icons/troops/natars/icon-natarian-knight')).IconNatarianKnight,
}));
const IconUnitNatarNatarianCatapult = lazy(async () => ({
  default: (await import('app/components/icons/troops/natars/icon-natarian-catapult')).IconNatarianCatapult,
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

type GaulTroopIconType = UpperCaseToCamelCase<
  PickLiteral<GaulUnitId, 'PATHFINDER' | 'THEUTATES_THUNDER' | 'DRUIDRIDER' | 'HAEDUAN' | 'GAUL_CATAPULT'>
>;

type TeutonTroopIconType = UpperCaseToCamelCase<PickLiteral<TeutonUnitId, 'PALADIN' | 'TEUTONIC_KNIGHT' | 'TEUTONIC_CATAPULT'>>;

type HunTroopIconType = UpperCaseToCamelCase<PickLiteral<HunUnitId, 'SPOTTER' | 'STEPPE_RIDER' | 'MARKSMAN' | 'MARAUDER' | 'HUN_CATAPULT'>>;

type EgyptianTroopIconType = UpperCaseToCamelCase<
  PickLiteral<EgyptianUnitId, 'SOPDU_EXPLORER' | 'ANHUR_GUARD' | 'RESHEPH_CHARIOT' | 'EGYPTIAN_CATAPULT'>
>;

type NatarTroopIconType = UpperCaseToCamelCase<PickLiteral<NatarUnitId, 'AXERIDER' | 'NATARIAN_KNIGHT' | 'NATARIAN_CATAPULT'>>;

type NatureTroopIconType = UpperCaseToCamelCase<NatureUnitId>;

type UnitAttributeType = 'carryCapacity' | 'unitSpeed';

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
  equitesLegati: IconUnitRomansEquitesLegati,
  equitesImperatoris: IconUnitRomansEquitesImperatoris,
  equitesCaesaris: IconUnitRomansEquitesCaesaris,
  romanRam: IconUnitRomansRomanRam,
  romanCatapult: IconUnitRomansRomanCatapult,
  senator: IconUnitRomansSenator,
  romanSettler: IconUnitRomansRomanSettler,

  // Gaul troops
  pathfinder: IconUnitGaulsPathfinder,
  theutatesThunder: IconUnitGaulsTheutatesThunder,
  druidrider: IconUnitGaulsDruidrider,
  haeduan: IconUnitGaulsHaeduan,
  gaulCatapult: IconUnitGaulGaulCatapult,

  // Teuton troops
  paladin: IconUnitTeutonsPaladin,
  teutonicKnight: IconUnitTeutonsTeutonicKnight,
  teutonicCatapult: IconUnitTeutonsTeutonicCatapult,

  // Egyptian troops
  sopduExplorer: IconUnitEgyptiansSopduExplorer,
  anhurGuard: IconUnitEgyptiansAnhurGuard,
  reshephChariot: IconUnitEgyptiansReshephChariot,
  egyptianCatapult: IconUnitEgyptiansEgyptianCatapult,

  // Hun troops
  spotter: IconUnitHunSpotter,
  steppeRider: IconUnitHunSteppeRider,
  marksman: IconUnitHunMarksman,
  marauder: IconUnitHunMarauder,
  hunCatapult: IconUnitHunHunCatapult,

  // Natar troops
  axerider: IconUnitNatarAxerider,
  natarianKnight: IconUnitNatarNatarianKnight,
  natarianCatapult: IconUnitNatarNatarianCatapult,

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

  // Adventures
  adventureDifficult: IconAdventureDifficult,
  adventureNormal: IconAdventureNormal,

  // Common
  cancel: IconCancel,
};

// Not all icons are present in here, only the needed ones. This object needs to be as narrow as possible, because classes in here
// are present in final css bundle!
// TODO: Deprecate this solution once custom icons have been added
export const typeToIconCssClass: Partial<Record<IconType, string>> = {
  missingIcon: 'icon-[gr-document-missing]',

  // Resources
  wood: 'icon icon-[gi-wood-pile] text-[#A1662F]',
  clay: 'icon icon-[gi-stone-block] text-[#cc7357]',
  iron: 'icon icon-[gi-metal-bar] text-gray-500',
  wheat: 'icon icon-[lu-wheat] text-yellow-500',
  woodWheat: 'icon icon-[gi-wood-pile] text-[#A1662F]',
  clayWheat: 'icon icon-[gi-stone-block] text-[#cc7357]',
  ironWheat: 'icon icon-[gi-metal-bar] text-gray-500',
  woodWood: 'icon icon-[gi-wood-pile] text-[#A1662F]',
  clayClay: 'icon icon-[gi-stone-block] text-[#cc7357]',
  ironIron: 'icon icon-[gi-metal-bar] text-gray-500',
  wheatWheat: 'icon icon-[lu-wheat] text-yellow-500',

  // Map treasures
  treasureTileItem: 'icon icon-[lu-sword]',
  treasureTileResources: 'icon icon-[gi-wood-pile]',
  treasureTileArtifact: 'icon icon-[si-artifacthub]',
  treasureTileCurrency: 'icon icon-[lia-coins-solid]',
  treasureTileMiscellaneous: 'icon icon-[sl-chemistry]',
};
