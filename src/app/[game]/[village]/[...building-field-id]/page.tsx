import { BuildingConstructionModal } from 'app/[game]/[village]/[...building-field-id]/components/building-construction-modal';
import { BuildingUpgradeModal } from 'app/[game]/[village]/[...building-field-id]/components/building-upgrade-modal';
import { Backlink } from 'app/[game]/components/backlink';
import { useRouteSegments } from 'app/[game]/hooks/routes/use-route-segments';
import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';
import { getBuildingFieldByBuildingFieldId } from 'app/[game]/utils/common';
import type React from 'react';

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
