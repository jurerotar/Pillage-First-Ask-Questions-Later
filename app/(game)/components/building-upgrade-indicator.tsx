import { useBuildingActions } from 'app/(game)/(village)/hooks/use-building-actions';
import {
  BorderIndicator,
  type BorderIndicatorBackgroundVariant,
  type BorderIndicatorBorderVariant,
} from 'app/(game)/components/border-indicator';
import { useComputedEffect } from 'app/(game)/hooks/use-computed-effect';
import { CurrentVillageContext } from 'app/(game)/providers/current-village-provider';
import { useDeveloperMode } from 'app/(game)/hooks/use-developer-mode';
import { useEvents } from 'app/(game)/hooks/use-events';
import { calculatePopulationFromBuildingFields, getBuildingDataForLevel } from 'app/(game)/utils/building';
import useLongPress from 'app/hooks/events/use-long-press';
import type { BuildingField } from 'app/interfaces/models/game/village';
import clsx from 'clsx';
import type React from 'react';
import { use, useState } from 'react';
import { CurrentResourceContext } from 'app/(game)/providers/current-resources-provider';
import { ViewportContext } from 'app/providers/viewport-context';
import { MdUpgrade } from 'react-icons/md';
import type { Building } from 'app/interfaces/models/game/building';

type StaticButtonProps = {
  level: number;
  backgroundVariant: BorderIndicatorBackgroundVariant;
  variant: BorderIndicatorBorderVariant;
  canUpgrade: boolean;
};

const StaticButton: React.FC<StaticButtonProps> = ({ level, backgroundVariant, variant, canUpgrade }) => (
  <button
    className={clsx(canUpgrade && 'hover:scale-125', 'rounded-full cursor-pointer transition-transform duration-300 relative')}
    type="button"
    disabled={!canUpgrade}
  >
    <BorderIndicator
      backgroundVariant={backgroundVariant}
      variant={variant}
    >
      {level}
    </BorderIndicator>
  </button>
);

type UpgradeButtonProps = {
  buildingId: Building['id'];
  buildingFieldId: BuildingField['id'];
  canUpgrade: boolean;
  backgroundVariant: BorderIndicatorBackgroundVariant;
  variant: BorderIndicatorBorderVariant;
  level: number;
};

const UpgradeButton: React.FC<UpgradeButtonProps> = ({ buildingId, buildingFieldId, canUpgrade, backgroundVariant, variant, level }) => {
  const { upgradeBuilding } = useBuildingActions(buildingId, buildingFieldId);
  const { isWiderThanMd } = use(ViewportContext);

  const [shouldShowUpgradeButton, setShouldShowUpgradeButton] = useState<boolean>(false);

  const onUpgradeButtonClick = (event: React.MouseEvent | React.TouchEvent) => {
    upgradeBuilding();
    event.stopPropagation();
    event.preventDefault();
  };

  const longPressEvent = useLongPress((event) => {
    onUpgradeButtonClick(event);
  });

  return (
    <button
      className={clsx(canUpgrade && 'hover:scale-125', 'rounded-full cursor-pointer transition-transform duration-300 relative')}
      type="button"
      onClick={onUpgradeButtonClick}
      {...(!isWiderThanMd && longPressEvent)}
      disabled={!canUpgrade}
      onMouseEnter={() => setShouldShowUpgradeButton(true)}
      onMouseLeave={() => setShouldShowUpgradeButton(false)}
    >
      <BorderIndicator
        backgroundVariant={backgroundVariant}
        variant={variant}
      >
        {shouldShowUpgradeButton && canUpgrade && <MdUpgrade className="size-3/4 rounded-full text-gray-400" />}
        {!(shouldShowUpgradeButton && canUpgrade) && level}
      </BorderIndicator>
    </button>
  );
};

type BuildingUpgradeIndicatorProps = {
  isHovered: boolean;
  buildingFieldId: BuildingField['id'];
};

export const BuildingUpgradeIndicator: React.FC<BuildingUpgradeIndicatorProps> = ({ buildingFieldId, isHovered }) => {
  const { currentVillage } = use(CurrentVillageContext);
  const { cumulativeBaseEffectValue: wheatBuildingLimit } = useComputedEffect('wheatProduction');
  const { total: warehouseCapacity } = useComputedEffect('warehouseCapacity');
  const { total: granaryCapacity } = useComputedEffect('granaryCapacity');
  const { wood, clay, iron, wheat } = use(CurrentResourceContext);
  const { getCurrentVillageBuildingEvents, getCanAddAdditionalBuildingToQueue } = useEvents();
  const { isDeveloperModeActive } = useDeveloperMode();

  const population = calculatePopulationFromBuildingFields(currentVillage.buildingFields, currentVillage.buildingFieldsPresets);
  const { buildingId, level } = currentVillage.buildingFields.find(({ id }) => buildingFieldId === id)!;
  const { isMaxLevel, nextLevelResourceCost, nextLevelCropConsumption } = getBuildingDataForLevel(buildingId, level);

  const variant = ((): BorderIndicatorBorderVariant => {
    if (isDeveloperModeActive) {
      return 'red';
    }

    if (isMaxLevel) {
      return 'blue';
    }

    if (wheatBuildingLimit - population < nextLevelCropConsumption) {
      return 'gray';
    }

    if (nextLevelResourceCost.filter((_, i) => i < 3).some((buildingCost) => buildingCost > warehouseCapacity)) {
      return 'gray';
    }

    if (granaryCapacity < nextLevelResourceCost[3]) {
      return 'gray';
    }

    if (
      wood < nextLevelResourceCost[0] ||
      clay < nextLevelResourceCost[1] ||
      iron < nextLevelResourceCost[2] ||
      wheat < nextLevelResourceCost[3]
    ) {
      return 'yellow';
    }

    if (!getCanAddAdditionalBuildingToQueue(currentVillage)) {
      return 'yellow';
    }

    return 'green';
  })();

  const canUpgrade: boolean = (() => {
    // You can upgrade, ignoring any restriction except max level
    if (isDeveloperModeActive) {
      return !isMaxLevel;
    }

    return variant === 'green' || variant === 'red';
  })();

  const backgroundVariant = ((): BorderIndicatorBackgroundVariant => {
    const currentVillageBuildingEvents = getCurrentVillageBuildingEvents(currentVillage);
    const hasSameBuildingConstructionEvents = currentVillageBuildingEvents.some(({ buildingFieldId: eventBuildingFieldId, building }) => {
      return building.id === buildingId && eventBuildingFieldId === buildingFieldId;
    });

    if (hasSameBuildingConstructionEvents) {
      return 'orange';
    }

    return 'white';
  })();

  // TODO: Transitions needs to added here, the icon currently just pops in

  if (isHovered) {
    return (
      <UpgradeButton
        buildingId={buildingId}
        buildingFieldId={buildingFieldId}
        canUpgrade={canUpgrade}
        backgroundVariant={backgroundVariant}
        variant={variant}
        level={level}
      />
    );
  }

  return (
    <StaticButton
      level={level}
      backgroundVariant={backgroundVariant}
      variant={variant}
      canUpgrade={canUpgrade}
    />
  );
};
