import { useBuildingActions } from 'app/(game)/(village)/hooks/use-building-actions';
import {
  BorderIndicator,
  type BorderIndicatorBackgroundVariant,
  type BorderIndicatorBorderVariant,
} from 'app/(game)/components/border-indicator';
import { useComputedEffect } from 'app/(game)/hooks/use-computed-effect';
import { useCurrentVillage } from 'app/(game)/hooks/use-current-village';
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

type BuildingUpgradeIndicatorProps = {
  buildingFieldId: BuildingField['id'];
};

export const BuildingUpgradeIndicator: React.FC<BuildingUpgradeIndicatorProps> = ({ buildingFieldId }) => {
  const {
    currentVillage: { buildingFields, buildingFieldsPresets },
  } = useCurrentVillage();
  const { cumulativeBaseEffectValue: wheatBuildingLimit } = useComputedEffect('wheatProduction');
  const { total: warehouseCapacity } = useComputedEffect('warehouseCapacity');
  const { total: granaryCapacity } = useComputedEffect('granaryCapacity');
  const { wood, clay, iron, wheat } = use(CurrentResourceContext);
  const { canAddAdditionalBuildingToQueue, currentVillageBuildingEvents } = useEvents();
  const { isDeveloperModeActive } = useDeveloperMode();
  const { isWiderThanMd } = use(ViewportContext);

  const population = calculatePopulationFromBuildingFields(buildingFields, buildingFieldsPresets);
  const { buildingId, level } = buildingFields.find(({ id }) => buildingFieldId === id)!;
  const { isMaxLevel, nextLevelResourceCost, nextLevelCropConsumption } = getBuildingDataForLevel(buildingId, level);
  const { upgradeBuilding } = useBuildingActions(buildingId, buildingFieldId);

  const onUpgradeButtonClick = (event: React.MouseEvent | React.TouchEvent) => {
    upgradeBuilding();
    event.stopPropagation();
    event.preventDefault();
  };

  const longPressEvent = useLongPress((event) => {
    onUpgradeButtonClick(event);
  });

  const [shouldShowUpgradeButton, setShouldShowUpgradeButton] = useState<boolean>(false);

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

    if (!canAddAdditionalBuildingToQueue) {
      return 'yellow';
    }

    return 'green';
  })();

  const canUpgrade: boolean = variant === 'green' || variant === 'red';

  const backgroundVariant = ((): BorderIndicatorBackgroundVariant => {
    const hasSameBuildingConstructionEvents = currentVillageBuildingEvents.some(({ buildingFieldId: eventBuildingFieldId, building }) => {
      return building.id === buildingId && eventBuildingFieldId === buildingFieldId;
    });

    if (hasSameBuildingConstructionEvents) {
      return 'orange';
    }

    return 'white';
  })();

  // TODO: Transitions needs to added here, the icon currently just pops in

  return (
    <button
      className={clsx(canUpgrade && 'hover:scale-125', 'rounded-full cursor-pointer transition-transform duration-300 relative')}
      type="button"
      {...(isWiderThanMd && {
        onClick: onUpgradeButtonClick,
      })}
      {...(!isWiderThanMd && { ...longPressEvent })}
      disabled={!canUpgrade}
    >
      <BorderIndicator
        backgroundVariant={backgroundVariant}
        variant={variant}
        onMouseEnter={() => setShouldShowUpgradeButton(true)}
        onMouseLeave={() => setShouldShowUpgradeButton(false)}
      >
        {shouldShowUpgradeButton && canUpgrade && <MdUpgrade className="size-3/4 rounded-full text-gray-400" />}
        {!(shouldShowUpgradeButton && canUpgrade) && level}
      </BorderIndicator>
    </button>
  );
};
