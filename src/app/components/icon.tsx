import { BorderIndicator, type BorderIndicatorProps } from 'app/[game]/components/border-indicator';
import { ConditionalWrapper } from 'app/components/conditional-wrapper';
import clsx from 'clsx';
import type { EffectId } from 'interfaces/models/game/effect';
import type { Unit } from 'interfaces/models/game/unit';
import { camelCase } from 'moderndash';
import type React from 'react';
import { Suspense, lazy } from 'react';
import type { IconBaseProps } from 'react-icons';

const IconMissingIcon = lazy(async () => ({ default: (await import('app/components/icons/icon-missing-icon')).IconMissingIcon }));

const IconResourceWheat = lazy(async () => ({ default: (await import('app/components/icons/resources/icon-wheat')).IconWheat }));
const IconResourceIron = lazy(async () => ({ default: (await import('app/components/icons/resources/icon-iron')).IconIron }));
const IconResourceWood = lazy(async () => ({ default: (await import('app/components/icons/resources/icon-wood')).IconWood }));
const IconResourceClay = lazy(async () => ({ default: (await import('app/components/icons/resources/icon-clay')).IconClay }));

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

// Village
const IconPopulationCropConsumption = lazy(async () => ({
  default: (await import('app/components/icons/village/icon-population-crop-consumption')).IconPopulationCropConsumption,
}));
const IconTroopsCropConsumption = lazy(async () => ({
  default: (await import('app/components/icons/village/icon-troops-crop-consumption')).IconTroopsCropConsumption,
}));

// Roman troops
const IconUnitRomanLegionnaire = lazy(async () => ({
  default: (await import('app/components/icons/troops/romans/icon-legionnaire')).IconLegionnaire,
}));
const IconUnitRomanPraetorian = lazy(async () => ({
  default: (await import('app/components/icons/troops/romans/icon-praetorian')).IconPraetorian,
}));
const IconUnitRomanImperian = lazy(async () => ({
  default: (await import('app/components/icons/troops/romans/icon-imperian')).IconImperian,
}));
const IconUnitRomanEquitesLegati = lazy(async () => ({
  default: (await import('app/components/icons/troops/romans/icon-equites-legati')).IconEquitesLegati,
}));
const IconUnitRomanEquitesImperatoris = lazy(async () => ({
  default: (await import('app/components/icons/troops/romans/icon-equites-imperatoris')).IconEquitesImperatoris,
}));
const IconUnitRomanEquitesCaesaris = lazy(async () => ({
  default: (await import('app/components/icons/troops/romans/icon-equites-caesaris')).IconEquitesCaesaris,
}));
const IconUnitRomanRomanRam = lazy(async () => ({
  default: (await import('app/components/icons/troops/romans/icon-roman-ram')).IconRomanRam,
}));
const IconUnitRomanFireCatapult = lazy(async () => ({
  default: (await import('app/components/icons/troops/romans/icon-fire-catapult')).IconFireCatapult,
}));
const IconUnitRomanSenator = lazy(async () => ({
  default: (await import('app/components/icons/troops/romans/icon-senator')).IconSenator,
}));
const IconUnitRomanRomanSettler = lazy(async () => ({
  default: (await import('app/components/icons/troops/romans/icon-roman-settler')).IconRomanSettler,
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

// Variants
const IconNegativeChangeVariant = lazy(async () => ({
  default: (await import('app/components/icons/variants/icon-negative-change-variant')).IconNegativeChangeVariant,
}));
const IconPositiveChangeVariant = lazy(async () => ({
  default: (await import('app/components/icons/variants/icon-positive-change-variant')).IconPositiveChangeVariant,
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

export type TreasureTileIconType = 'treasureTileItem' | 'treasureTileResources' | 'treasureTileArtifact' | 'treasureTileCurrency';

export type ResourceCombinationIconType = 'woodWheat' | 'clayWheat' | 'ironWheat' | 'woodWood' | 'clayClay' | 'ironIron' | 'wheatWheat';

type ResourceIconType = 'wood' | 'clay' | 'iron' | 'wheat';

type VillageIconType = 'populationCropConsumption' | 'troopsCropConsumption';

type RomanTroopIconType =
  | 'legionnaire'
  | 'praetorian'
  | 'imperian'
  | 'equitesLegati'
  | 'equitesImperatoris'
  | 'equitesCaesaris'
  | 'romanRam'
  | 'fireCatapult'
  | 'senator'
  | 'romanSettler';

type NatureTroopIconType = 'rat' | 'spider' | 'serpent' | 'bat' | 'wildBoar' | 'wolf' | 'bear' | 'crocodile' | 'tiger' | 'elephant';

type UnitIconType = RomanTroopIconType | NatureTroopIconType;

type OtherIconType = 'freeCrop' | 'population';

export type IconType =
  | MissingIconType
  | ReportIconType
  | ResourceCombinationIconType
  | ResourceIconType
  | MapControlsIconType
  | TreasureTileIconType
  | VillageIconType
  | UnitIconType
  | MapAdventureIconType
  | OtherIconType
  | EffectId;

// @ts-ignore - TODO: Add missing icons
export const typeToIconMap: Record<IconType, React.LazyExoticComponent<() => JSX.Element>> = {
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
  // Romans
  legionnaire: IconUnitRomanLegionnaire,
  praetorian: IconUnitRomanPraetorian,
  imperian: IconUnitRomanImperian,
  equitesLegati: IconUnitRomanEquitesLegati,
  equitesImperatoris: IconUnitRomanEquitesImperatoris,
  equitesCaesaris: IconUnitRomanEquitesCaesaris,
  romanRam: IconUnitRomanRomanRam,
  fireCatapult: IconUnitRomanFireCatapult,
  senator: IconUnitRomanSenator,
  romanSettler: IconUnitRomanRomanSettler,
  // Animals
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
};

const IconPlaceholder = () => {
  return <span className="" />;
};

export const unitIdToUnitIconMapper = (unitId: Unit['id']): UnitIconType => {
  return camelCase(unitId) as UnitIconType;
};

export type IconProps = IconBaseProps &
  React.HTMLAttributes<HTMLSpanElement> & {
    type: IconType;
    variant?: 'positive-change' | 'negative-change';
    borderVariant?: BorderIndicatorProps['variant'];
    wrapperClassName?: string;
  };

// TODO: Replace library icons by custom icons
export const Icon: React.FC<IconProps> = (props) => {
  const { type, variant, borderVariant, className, wrapperClassName, ...rest } = props;

  // @ts-ignore - TODO: Add missing icons
  const ComputedIcon = typeToIconMap[type] ?? typeToIconMap.missingIcon;

  const hasVariantIcon = !!variant;

  return (
    <ConditionalWrapper
      condition={!!borderVariant}
      wrapper={(children) => (
        <BorderIndicator
          className={wrapperClassName}
          variant={borderVariant}
        >
          {children}
        </BorderIndicator>
      )}
    >
      <Suspense fallback={<IconPlaceholder />}>
        <span
          role="img"
          className={clsx(hasVariantIcon && 'relative', className)}
          {...rest}
        >
          <ComputedIcon />
          {hasVariantIcon && (
            <span className="absolute bottom-[-2px] right-[-6px] size-3 rounded-full shadow bg-white">
              {variant === 'positive-change' && <IconPositiveChangeVariant />}
              {variant === 'negative-change' && <IconNegativeChangeVariant />}
            </span>
          )}
        </span>
      </Suspense>
    </ConditionalWrapper>
  );
};
