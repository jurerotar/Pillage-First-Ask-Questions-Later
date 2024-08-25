import { BuildingConstruction } from 'app/[game]/[village]/[...building-field-id]/components/building-construction';
import { BuildingUpgrade } from 'app/[game]/[village]/[...building-field-id]/components/building-upgrade';
import { Backlink } from 'app/[game]/components/backlink';
import { useRouteSegments } from 'app/[game]/hooks/routes/use-route-segments';
import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';
import { getBuildingFieldByBuildingFieldId } from 'app/[game]/utils/building';
import type React from 'react';

export const BuildingPage: React.FC = () => {
  const { buildingFieldId } = useRouteSegments();
  const { currentVillage } = useCurrentVillage();
  const buildingField = getBuildingFieldByBuildingFieldId(currentVillage, buildingFieldId!);
  const hasBuilding = !!buildingField;

  return (
    <main className="mt-24">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <Backlink />
        {hasBuilding && <BuildingUpgrade />}
        {!hasBuilding && <BuildingConstruction />}
      </div>
    </main>
  );
};
