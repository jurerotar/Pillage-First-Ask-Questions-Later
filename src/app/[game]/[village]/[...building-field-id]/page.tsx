import React from 'react';
import { useRouteSegments } from 'app/[game]/hooks/routes/use-route-segments';
import { getBuildingFieldByBuildingFieldId } from 'app/[game]/utils/common';
import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';
import { Backlink } from 'app/[game]/components/backlink';
import { BuildingConstructionModal } from 'app/[game]/[village]/[...building-field-id]/components/building-construction-modal';
import { BuildingUpgradeModal } from 'app/[game]/[village]/[...building-field-id]/components/building-upgrade-modal';

export const BuildingPage: React.FC = () => {
  const { buildingFieldId } = useRouteSegments();
  const { currentVillage } = useCurrentVillage();
  const buildingField = getBuildingFieldByBuildingFieldId(currentVillage, buildingFieldId!);
  const hasBuilding = !!buildingField;

  return (
    <main className="mt-24">
      Building construction / upgrade page
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <Backlink />
        {hasBuilding && <BuildingUpgradeModal />}
        {!hasBuilding && <BuildingConstructionModal />}
      </div>
    </main>
  );
};
