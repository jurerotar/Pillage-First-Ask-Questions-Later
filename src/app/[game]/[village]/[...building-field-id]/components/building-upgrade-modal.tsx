import { BuildingCard } from 'app/[game]/[village]/components/building-card';
import { useRouteSegments } from 'app/[game]/hooks/routes/use-route-segments';
import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';
import { getBuildingFieldByBuildingFieldId } from 'app/[game]/utils/common';
import React from 'react';

export const BuildingUpgradeModal = () => {
  const { buildingFieldId } = useRouteSegments();
  const { currentVillage } = useCurrentVillage();
  const { buildingId } = getBuildingFieldByBuildingFieldId(currentVillage, buildingFieldId!)!;

  return (
    <BuildingCard
      buildingId={buildingId}
      buildingFieldId={buildingFieldId!}
    />
  );
};
