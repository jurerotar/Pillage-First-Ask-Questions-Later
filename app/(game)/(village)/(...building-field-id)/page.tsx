import { BuildingConstruction } from 'app/(game)/(village)/(...building-field-id)/components/building-construction';
import { BuildingDetails } from 'app/(game)/(village)/(...building-field-id)/components/building-details';
import { Backlink } from 'app/(game)/components/backlink';
import { useRouteSegments } from 'app/(game)/hooks/routes/use-route-segments';
import { useCurrentVillage } from 'app/(game)/hooks/use-current-village';
import { getBuildingFieldByBuildingFieldId } from 'app/(game)/utils/building';
import type React from 'react';

const BuildingPage: React.FC = () => {
  const { buildingFieldId } = useRouteSegments();
  const { currentVillage } = useCurrentVillage();
  const buildingField = getBuildingFieldByBuildingFieldId(currentVillage, buildingFieldId!);
  const hasBuilding = !!buildingField;

  return (
    <main className="[view-transition-name:building-field-id-page] mt-2 md:mt-24 mx-auto max-w-2xl px-2 lg:px-0 mb-14 lg:mb-0">
      <div className="flex flex-col gap-2">
        <Backlink />
        {hasBuilding && <BuildingDetails />}
        {!hasBuilding && <BuildingConstruction />}
      </div>
    </main>
  );
};

export default BuildingPage;
