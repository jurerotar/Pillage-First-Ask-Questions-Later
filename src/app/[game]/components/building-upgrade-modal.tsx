import { BuildingField } from 'interfaces/models/game/village';
import React from 'react';
import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';
import { getBuildingFieldByBuildingFieldId } from 'app/[game]/utils/common';
import { BuildingCard } from 'app/[game]/[village]/components/building-card';

type BuildingUpgradeModalProps = {
  buildingFieldId: BuildingField['id'];
  modalCloseHandler: () => void;
}

export const BuildingUpgradeModal: React.FC<BuildingUpgradeModalProps> = ({ buildingFieldId, modalCloseHandler }) => {
  const { currentVillage } = useCurrentVillage();
  const { buildingId } = getBuildingFieldByBuildingFieldId(currentVillage, buildingFieldId)!;

  return (
    <BuildingCard
      location="building-upgrade-modal"
      buildingId={buildingId}
      buildingFieldId={buildingFieldId}
    />
  );
};
