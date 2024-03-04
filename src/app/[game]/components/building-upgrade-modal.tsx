import { BuildingFieldId } from 'interfaces/models/game/village';
import React from 'react';
import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';
import { getBuildingFieldByBuildingFieldId } from 'app/[game]/utils/common';

type BuildingUpgradeModalProps = {
  buildingFieldId: BuildingFieldId;
}

export const BuildingUpgradeModal: React.FC<BuildingUpgradeModalProps> = ({ buildingFieldId }) => {
  const { currentVillage } = useCurrentVillage();
  const building = getBuildingFieldByBuildingFieldId(currentVillage, buildingFieldId)!;


  return (
    <></>
  );
};
