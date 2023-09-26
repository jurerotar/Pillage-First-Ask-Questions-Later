import React, { lazy, Suspense } from 'react';
import { IconBaseProps } from 'react-icons';
import { ConditionalWrapper } from 'components/conditional-wrapper';
import { BorderIndicator, BorderIndicatorProps } from 'components/border-indicator';
import clsx from 'clsx';

const IconWheat = lazy(async () => ({ default: (await import('components/icons/icon-wheat')).IconWheat }));
const IconIron = lazy(async () => ({ default: (await import('components/icons/icon-iron')).IconIron }));
const IconWood = lazy(async () => ({ default: (await import('components/icons/icon-wood')).IconWood }));
const IconClay = lazy(async () => ({ default: (await import('components/icons/icon-clay')).IconClay }));

type AvailableIconTypes =
  | 'wood'
  | 'clay'
  | 'iron'
  | 'wheat'
  | 'woodWheat'
  | 'clayWheat'
  | 'ironWheat'
  | 'wheatWheat';
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

export type IconProps = IconBaseProps & {
  type: AvailableIconTypes;
  borderVariant?: BorderIndicatorProps['variant'];
};

const typeToIconMap = {
  wood: IconWood,
  clay: IconClay,
  iron: IconIron,
  wheat: IconWheat,
  woodWheat: IconWood,
  clayWheat: IconClay,
  ironWheat: IconIron,
  wheatWheat: IconWheat
};

const IconPlaceholder = () => {
  return <span className="" />;
};

// TODO: Replace library icons by custom icons
export const Icon: React.FC<IconProps> = (props) => {
  const {
    type,
    borderVariant,
    className = ''
  } = props;

  const ComputedIcon = typeToIconMap[type];

  return (
    <ConditionalWrapper
      condition={!!borderVariant}
      wrapper={(children) => <BorderIndicator variant={borderVariant}>{children}</BorderIndicator>}
    >
      <Suspense fallback={<IconPlaceholder />}>
        <span className={clsx(className)}>
          <ComputedIcon />
        </span>
      </Suspense>
    </ConditionalWrapper>
  );
};
