import { BuildingField } from 'interfaces/models/game/village';
import React from 'react';
import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';
import { BorderIndicator, BorderIndicatorVariant } from 'app/[game]/components/border-indicator';
import { getBuildingDataForLevel } from 'app/[game]/utils/common';
import { useComputedEffect } from 'app/[game]/hooks/use-computed-effect';
import { useCurrentResources } from 'app/[game]/hooks/use-current-resources';

type BuildingUpgradeIndicatorProps = {
  buildingFieldId: BuildingField['id'];
};

export const BuildingUpgradeIndicator: React.FC<BuildingUpgradeIndicatorProps> = ({ buildingFieldId }) => {
  const { population } = useCurrentVillage();
  const { currentVillage } = useCurrentVillage();
  const { cumulativeBaseEffectValue: wheatBuildingLimit } = useComputedEffect('wheatProduction');
  const { total: warehouseCapacity } = useComputedEffect('warehouseCapacity');
  const { total: granaryCapacity } = useComputedEffect('granaryCapacity');
  const { calculatedResourceAmount: currentWood } = useCurrentResources('wood');
  const { calculatedResourceAmount: currentClay } = useCurrentResources('clay');
  const { calculatedResourceAmount: currentIron } = useCurrentResources('iron');
  const { calculatedResourceAmount: currentWheat } = useCurrentResources('wheat');

  const { buildingId, level } = currentVillage.buildingFields.find(({ id }) => buildingFieldId === id)!;
  const { isMaxLevel, nextLevelResourceCost, nextLevelCropConsumption } = getBuildingDataForLevel(buildingId, level);

  const variant = ((): BorderIndicatorVariant => {
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
      currentWood < nextLevelResourceCost[0] ||
      currentClay < nextLevelResourceCost[1] ||
      currentIron < nextLevelResourceCost[2] ||
      currentWheat < nextLevelResourceCost[3]
    ) {
      return 'yellow';
    }

    return 'green';
  })();

  return <BorderIndicator variant={variant}>{level}</BorderIndicator>;
};
