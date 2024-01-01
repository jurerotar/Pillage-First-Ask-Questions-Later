import { BuildingFieldId } from 'interfaces/models/game/village';
import React from 'react';
import { useCurrentVillage } from 'hooks/game/use-current-village';
import { useBuilding } from 'hooks/game/use-building';
import { BorderIndicator, BorderIndicatorVariant } from 'components/border-indicator';

type BuildingUpgradeIndicatorProps = {
  buildingFieldId: BuildingFieldId;
};

export const BuildingUpgradeIndicator: React.FC<BuildingUpgradeIndicatorProps> = ({ buildingFieldId }) => {
  const {
    currentVillage: { resourceFields },
  } = useCurrentVillage();
  const { buildingId, level } = resourceFields.find(({ buildingFieldId: fieldId }) => buildingFieldId === fieldId)!;
  const { isMaxLevel, canUpgradeBuilding } = useBuilding(buildingId, level);

  const variant = ((): BorderIndicatorVariant => {
    if (isMaxLevel) {
      return 'blue';
    }
    if (!canUpgradeBuilding) {
      return 'gray';
    }
    return 'green';
  })();

  return <BorderIndicator variant={variant}>{level}</BorderIndicator>;
};
