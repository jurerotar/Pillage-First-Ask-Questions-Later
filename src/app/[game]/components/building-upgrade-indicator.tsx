import { BuildingFieldId } from 'interfaces/models/game/village';
import React from 'react';
import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';
import { BorderIndicator, BorderIndicatorVariant } from 'app/components/border-indicator';
import { getBuildingData } from 'app/[game]/utils/common';

type BuildingUpgradeIndicatorProps = {
  buildingFieldId: BuildingFieldId;
};

export const BuildingUpgradeIndicator: React.FC<BuildingUpgradeIndicatorProps> = ({ buildingFieldId }) => {
  const { currentVillage } = useCurrentVillage();
  const { buildingId, level } = currentVillage.buildingFields.find(({ buildingFieldId: fieldId }) => buildingFieldId === fieldId)!;
  const { isMaxLevel } = getBuildingData(buildingId, level);

  const variant = ((): BorderIndicatorVariant => {
    if (isMaxLevel) {
      return 'blue';
    }
    return 'green';
  })();

  return <BorderIndicator variant={variant}>{level}</BorderIndicator>;
};
