import { BuildingField } from 'interfaces/models/game/village';
import React from 'react';
import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';
import { BorderIndicator, BorderIndicatorVariant } from 'app/[game]/components/border-indicator';
import { getBuildingDataForLevel } from 'app/[game]/utils/common';

type BuildingUpgradeIndicatorProps = {
  buildingFieldId: BuildingField['id'];
};

export const BuildingUpgradeIndicator: React.FC<BuildingUpgradeIndicatorProps> = ({ buildingFieldId }) => {
  const { currentVillage } = useCurrentVillage();
  const { buildingId, level } = currentVillage.buildingFields.find(({ id }) => buildingFieldId === id)!;
  const { isMaxLevel } = getBuildingDataForLevel(buildingId, level);

  const variant = ((): BorderIndicatorVariant => {
    if (isMaxLevel) {
      return 'blue';
    }
    return 'green';
  })();

  return <BorderIndicator variant={variant}>{level}</BorderIndicator>;
};
