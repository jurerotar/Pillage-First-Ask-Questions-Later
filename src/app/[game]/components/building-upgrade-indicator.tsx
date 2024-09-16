import {
  BorderIndicator,
  type BorderIndicatorBackgroundVariant,
  type BorderIndicatorBorderVariant,
} from 'app/[game]/components/border-indicator';
import { useComputedEffect } from 'app/[game]/hooks/use-computed-effect';
import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';
import { useDeveloperMode } from 'app/[game]/hooks/use-developer-mode';
import { useEvents } from 'app/[game]/hooks/use-events';
import { useCurrentResources } from 'app/[game]/providers/current-resources-provider';
import { calculatePopulationFromBuildingFields, getBuildingDataForLevel } from 'app/[game]/utils/building';
import type { BuildingField } from 'interfaces/models/game/village';
import type React from 'react';

type BuildingUpgradeIndicatorProps = {
  buildingFieldId: BuildingField['id'];
};

export const BuildingUpgradeIndicator: React.FC<BuildingUpgradeIndicatorProps> = ({ buildingFieldId }) => {
  const { currentVillage } = useCurrentVillage();
  const { cumulativeBaseEffectValue: wheatBuildingLimit } = useComputedEffect('wheatProduction');
  const { total: warehouseCapacity } = useComputedEffect('warehouseCapacity');
  const { total: granaryCapacity } = useComputedEffect('granaryCapacity');
  const { wood, clay, iron, wheat } = useCurrentResources();
  const { canAddAdditionalBuildingToQueue, currentVillageBuildingEvents } = useEvents();
  const { isDeveloperModeActive } = useDeveloperMode();

  const population = calculatePopulationFromBuildingFields(currentVillage.buildingFields);
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

    if (!canAddAdditionalBuildingToQueue) {
      return 'yellow';
    }

    return 'green';
  })();

  const backgroundVariant = ((): BorderIndicatorBackgroundVariant => {
    const hasSameBuildingConstructionEvents = currentVillageBuildingEvents.some(({ buildingFieldId: eventBuildingFieldId, building }) => {
      return building.id === buildingId && eventBuildingFieldId === buildingFieldId;
    });

    if (hasSameBuildingConstructionEvents) {
      return 'orange';
    }

    return 'white';
  })();

  return (
    <BorderIndicator
      backgroundVariant={backgroundVariant}
      variant={variant}
    >
      {level}
    </BorderIndicator>
  );
};
