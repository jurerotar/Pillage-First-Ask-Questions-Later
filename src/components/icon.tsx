import React, { lazy, Suspense } from 'react';
import { IconBaseProps } from 'react-icons';
import { ConditionalWrapper } from 'components/conditional-wrapper';
import { BorderIndicator, BorderIndicatorProps } from 'components/border-indicator';

const IconResourceWheat = lazy(async () => ({ default: (await import('components/icons/resources/icon-wheat')).IconWheat }));
const IconResourceIron = lazy(async () => ({ default: (await import('components/icons/resources/icon-iron')).IconIron }));
const IconResourceWood = lazy(async () => ({ default: (await import('components/icons/resources/icon-wood')).IconWood }));
const IconResourceClay = lazy(async () => ({ default: (await import('components/icons/resources/icon-clay')).IconClay }));

// Resource combinations - WIP - We're using single-resource icons for now
const IconResourceCombinationWoodWheat = lazy(async () => ({
  default: (await import('components/icons/resource-combinations/icon-wood')).IconWood,
}));
const IconResourceCombinationIronWheat = lazy(async () => ({
  default: (await import('components/icons/resource-combinations/icon-iron')).IconIron,
}));
const IconResourceCombinationClayWheat = lazy(async () => ({
  default: (await import('components/icons/resource-combinations/icon-clay')).IconClay,
}));
const IconResourceCombinationWoodWood = lazy(async () => ({
  default: (await import('components/icons/resource-combinations/icon-wood')).IconWood,
}));
const IconResourceCombinationIronIron = lazy(async () => ({
  default: (await import('components/icons/resource-combinations/icon-iron')).IconIron,
}));
const IconResourceCombinationClayClay = lazy(async () => ({
  default: (await import('components/icons/resource-combinations/icon-clay')).IconClay,
}));
const IconResourceCombinationWheatWheat = lazy(async () => ({
  default: (await import('components/icons/resource-combinations/icon-wheat')).IconWheat,
}));

// Map controls
const IconMapMagnificationIncrease = lazy(async () => ({
  default: (await import('components/icons/map-controls/icon-map-magnification-increase')).IconMapMagnificationIncrease,
}));
const IconMapMagnificationDecrease = lazy(async () => ({
  default: (await import('components/icons/map-controls/icon-map-magnification-decrease')).IconMapMagnificationDecrease,
}));
const IconMapReputationToggle = lazy(async () => ({
  default: (await import('components/icons/map-controls/icon-map-reputation-toggle')).IconMapReputationToggle,
}));
const IconMapOasisIconsToggle = lazy(async () => ({
  default: (await import('components/icons/map-controls/icon-map-oasis-icons-toggle')).IconMapOasisIconsToggle,
}));
const IconMapTroopMovementsToggle = lazy(async () => ({
  default: (await import('components/icons/map-controls/icon-map-troop-movements-toggle')).IconMapTroopMovementsToggle,
}));
const IconMapWheatFieldIconToggle = lazy(async () => ({
  default: (await import('components/icons/map-controls/icon-map-wheat-field-icon-toggle')).IconMapWheatFieldIconToggle,
}));
const IconMapTileTooltipToggle = lazy(async () => ({
  default: (await import('components/icons/map-controls/icon-map-tile-tooltip-toggle')).IconMapTileTooltipToggle,
}));
const IconMapTreasuresToggle = lazy(async () => ({
  default: (await import('components/icons/map-controls/icon-map-treasures-toggle')).IconMapTreasuresToggle,
}));

// Map occupied tile icons
const IconTreasureTileItem = lazy(async () => ({
  default: (await import('components/icons/treasure-tile-icons/icon-treasure-tile-item')).IconTreasureTileItem,
}));
const IconTreasureTileResources = lazy(async () => ({
  default: (await import('components/icons/treasure-tile-icons/icon-treasure-tile-resources')).IconTreasureTileResources,
}));
const IconTreasureTileArtifact = lazy(async () => ({
  default: (await import('components/icons/treasure-tile-icons/icon-treasure-tile-artifact')).IconTreasureTileArtifact,
}));
const IconTreasureTileCurrency = lazy(async () => ({
  default: (await import('components/icons/treasure-tile-icons/icon-treasure-tile-currency')).IconTreasureTileCurrency,
}));

// Report icons
const IconAttackerNoLoss = lazy(async () => ({
  default: (await import('components/icons/report/icon-attacker-no-loss')).IconAttackerNoLoss,
}));
const IconAttackerSomeLoss = lazy(async () => ({
  default: (await import('components/icons/report/icon-attacker-some-loss')).IconAttackerSomeLoss,
}));
const IconAttackerFullLoss = lazy(async () => ({
  default: (await import('components/icons/report/icon-attacker-full-loss')).IconAttackerNoLoss,
}));
const IconDefenderNoLoss = lazy(async () => ({
  default: (await import('components/icons/report/icon-defender-no-loss')).IconDefenderNoLoss,
}));
const IconDefenderSomeLoss = lazy(async () => ({
  default: (await import('components/icons/report/icon-defender-some-loss')).IconDefenderSomeLoss,
}));
const IconDefenderFullLoss = lazy(async () => ({
  default: (await import('components/icons/report/icon-defender-full-loss')).IconDefenderFullLoss,
}));

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

export type TreasureTileIconType = 'treasureTileItem' | 'treasureTileResources' | 'treasureTileArtifact' | 'treasureTileCurrency';

export type ResourceCombinationIconType = 'woodWheat' | 'clayWheat' | 'ironWheat' | 'woodWood' | 'clayClay' | 'ironIron' | 'wheatWheat';

export type ResourceIconType = 'wood' | 'clay' | 'iron' | 'wheat';

type IconType = ReportIconType | ResourceCombinationIconType | ResourceIconType | MapControlsIconType | TreasureTileIconType;

// | 'cropConsumption'
// | 'culturePointsProduction'
// | 'trapperCapacity'
// | 'buildingDuration'
// | 'woodProduction'
// | 'clayProduction'
// | 'ironProduction'
// | 'wheatProduction'
// | 'totalResourceCost'
// | 'villageDefenceValue'
// | 'villageDefenceBonus';

/**
 *   TODO: Implement following icons
 *   'barracksTrainingDuration'
 *   | 'greatBarracksTrainingDuration'
 *   | 'stableTrainingDuration'
 *   | 'greatStableTrainingDuration'
 *   | 'workshopTrainingDuration'
 *   | 'hospitalTrainingDuration'
 *   | 'unitSpeedBonus'
 *   | 'unitSpeedAfter20TilesBonus'
 *   | 'amountOfUncoveredAttackingUnits'
 *   | 'amountOfUnlockedUnitResearchLevels'

 *   | 'buildingDurabilityBonus'
 *   | 'woodProductionBonus'
 *   | 'clayProductionBonus'
 *   | 'ironProductionBonus'
 *   | 'wheatProductionBonus'
 *   | 'oasisProductionBonus'
 *   | 'woodOasisProductionBonus'
 *   | 'clayOasisProductionBonus'
 *   | 'ironOasisProductionBonus'
 *   | 'wheatOasisProductionBonus'
 *   | 'oasisExpansionSlot'
 *   | 'culturePointsProductionBonus'
 *   | 'crannyCapacity'
 *   | 'crannyCapacityBonus'
 *   | 'breweryAttackBonus'
 *   | 'embassyCapacity'
 *   | 'merchantAmount'
 *   | 'merchantCapacityBonus'
 *   | 'granaryCapacity'
 *   | 'warehouseCapacity';
 */

const typeToIconMap: Record<IconType, React.LazyExoticComponent<() => JSX.Element>> = {
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
  mapMagnificationIncrease: IconMapMagnificationIncrease,
  mapMagnificationDecrease: IconMapMagnificationDecrease,
  mapReputationToggle: IconMapReputationToggle,
  mapOasisIconsToggle: IconMapOasisIconsToggle,
  mapTroopMovementsToggle: IconMapTroopMovementsToggle,
  mapWheatFieldIconToggle: IconMapWheatFieldIconToggle,
  mapTileTooltipToggle: IconMapTileTooltipToggle,
  mapTreasureIconToggle: IconMapTreasuresToggle,
  treasureTileItem: IconTreasureTileItem,
  treasureTileResources: IconTreasureTileResources,
  treasureTileArtifact: IconTreasureTileArtifact,
  treasureTileCurrency: IconTreasureTileCurrency,
  attackerNoLoss: IconAttackerNoLoss,
  attackerSomeLoss: IconAttackerSomeLoss,
  attackerFullLoss: IconAttackerFullLoss,
  defenderNoLoss: IconDefenderNoLoss,
  defenderSomeLoss: IconDefenderSomeLoss,
  defenderFullLoss: IconDefenderFullLoss,
};

const IconPlaceholder = () => {
  return <span className="" />;
};

export type IconProps = IconBaseProps &
  React.HTMLAttributes<HTMLSpanElement> & {
    type: IconType;
    borderVariant?: BorderIndicatorProps['variant'];
  };

// TODO: Replace library icons by custom icons
export const Icon: React.FC<IconProps> = (props) => {
  const { type, borderVariant, ...rest } = props;

  const ComputedIcon = typeToIconMap[type];

  return (
    <ConditionalWrapper
      condition={!!borderVariant}
      wrapper={(children) => <BorderIndicator variant={borderVariant}>{children}</BorderIndicator>}
    >
      <Suspense fallback={<IconPlaceholder />}>
        <span
          role="img"
          {...rest}
        >
          <ComputedIcon />
        </span>
      </Suspense>
    </ConditionalWrapper>
  );
};
