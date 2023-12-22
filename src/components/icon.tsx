import React, { lazy, Suspense } from 'react';
import { IconBaseProps } from 'react-icons';
import { ConditionalWrapper } from 'components/conditional-wrapper';
import { BorderIndicator, BorderIndicatorProps } from 'components/border-indicator';

const IconWheat = lazy(async () => ({ default: (await import('components/icons/icon-wheat')).IconWheat }));
const IconIron = lazy(async () => ({ default: (await import('components/icons/icon-iron')).IconIron }));
const IconWood = lazy(async () => ({ default: (await import('components/icons/icon-wood')).IconWood }));
const IconClay = lazy(async () => ({ default: (await import('components/icons/icon-clay')).IconClay }));

// Map controls
const IconMapMagnificationIncrease = lazy(async () => ({ default: (await import('components/icons/map-controls/icon-map-magnification-increase')).IconMapMagnificationIncrease }));
const IconMapMagnificationDecrease = lazy(async () => ({ default: (await import('components/icons/map-controls/icon-map-magnification-decrease')).IconMapMagnificationDecrease }));
const IconMapReputationToggle = lazy(async () => ({ default: (await import('components/icons/map-controls/icon-map-reputation-toggle')).IconMapReputationToggle }));
const IconMapOasisIconsToggle = lazy(async () => ({ default: (await import('components/icons/map-controls/icon-map-oasis-icons-toggle')).IconMapOasisIconsToggle }));
const IconMapTroopMovementsToggle = lazy(async () => ({ default: (await import('components/icons/map-controls/icon-map-troop-movements-toggle')).IconMapTroopMovementsToggle }));
const IconMapWheatFieldIconToggle = lazy(async () => ({ default: (await import('components/icons/map-controls/icon-map-wheat-field-icon-toggle')).IconMapWheatFieldIconToggle }));
const IconMapTileTooltipToggle = lazy(async () => ({ default: (await import('components/icons/map-controls/icon-map-tile-tooltip-toggle')).IconMapTileTooltipToggle }));
const IconMapTreasuresToggle = lazy(async () => ({ default: (await import('components/icons/map-controls/icon-map-treasures-toggle')).IconMapTreasuresToggle }));

// Map occupied tile icons
const IconTreasureTileItem = lazy(async () => ({ default: (await import('components/icons/treasure-tile-icons/icon-treasure-tile-item')).IconTreasureTileItem }));
const IconTreasureTileResources = lazy(async () => ({ default: (await import('components/icons/treasure-tile-icons/icon-treasure-tile-resources')).IconTreasureTileResources }));
const IconTreasureTileArtifact = lazy(async () => ({ default: (await import('components/icons/treasure-tile-icons/icon-treasure-tile-artifact')).IconTreasureTileArtifact }));
const IconTreasureTileCurrency = lazy(async () => ({ default: (await import('components/icons/treasure-tile-icons/icon-treasure-tile-currency')).IconTreasureTileCurrency }));

type MapControlsIconType =
  | 'mapMagnificationIncrease'
  | 'mapMagnificationDecrease'
  | 'mapReputationToggle'
  | 'mapOasisIconsToggle'
  | 'mapTroopMovementsToggle'
  | 'mapWheatFieldIconToggle'
  | 'mapTileTooltipToggle'
  | 'mapTreasureIconToggle';

export type TreasureTileIconType =
  | 'treasureTileItem'
  | 'treasureTileResources'
  | 'treasureTileArtifact'
  | 'treasureTileCurrency';

type IconType =
  | 'wood'
  | 'clay'
  | 'iron'
  | 'wheat'
  | 'woodWheat'
  | 'clayWheat'
  | 'ironWheat'
  | 'wheatWheat'
  | MapControlsIconType
  | TreasureTileIconType;

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
  wood: IconWood,
  clay: IconClay,
  iron: IconIron,
  wheat: IconWheat,
  woodWheat: IconWood,
  clayWheat: IconClay,
  ironWheat: IconIron,
  wheatWheat: IconWheat,
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
};

const IconPlaceholder = () => {
  return <span className="" />;
};

export type IconProps = IconBaseProps & React.HTMLAttributes<HTMLSpanElement> & {
  type: IconType;
  borderVariant?: BorderIndicatorProps['variant'];
};

// TODO: Replace library icons by custom icons
export const Icon: React.FC<IconProps> = (props) => {
  const {
    type,
    borderVariant,
    ...rest
  } = props;

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
