import { BorderIndicator, type BorderIndicatorVariant } from 'app/[game]/components/border-indicator';
import { useComputedEffect } from 'app/[game]/hooks/use-computed-effect';
import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';
import { getBuildingDataForLevel } from 'app/[game]/utils/building';
import type { BuildingField } from 'interfaces/models/game/village';
import type React from 'react';
import { useCurrentResources } from 'app/[game]/providers/current-resources-provider';

type BuildingUpgradeIndicatorProps = {
  buildingFieldId: BuildingField['id'];
};

export const BuildingUpgradeIndicator: React.FC<BuildingUpgradeIndicatorProps> = ({ buildingFieldId }) => {
  const { population } = useCurrentVillage();
  const { currentVillage } = useCurrentVillage();
  const { cumulativeBaseEffectValue: wheatBuildingLimit } = useComputedEffect('wheatProduction');
  const { total: warehouseCapacity } = useComputedEffect('warehouseCapacity');
  const { total: granaryCapacity } = useComputedEffect('granaryCapacity');
  const { wood, clay, iron, wheat } = useCurrentResources();

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
      wood < nextLevelResourceCost[0] ||
      clay < nextLevelResourceCost[1] ||
      iron < nextLevelResourceCost[2] ||
      wheat < nextLevelResourceCost[3]
    ) {
      return 'yellow';
    }

    return 'green';
  })();

  return <BorderIndicator variant={variant}>{level}</BorderIndicator>;
};
