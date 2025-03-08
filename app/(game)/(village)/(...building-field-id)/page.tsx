import { BuildingConstruction } from 'app/(game)/(village)/(...building-field-id)/components/building-construction';
import { BuildingDetails } from 'app/(game)/(village)/(...building-field-id)/components/building-details';
import { useRouteSegments } from 'app/(game)/hooks/routes/use-route-segments';
import { CurrentVillageContext } from 'app/(game)/providers/current-village-provider';
import { getBuildingFieldByBuildingFieldId } from 'app/(game)/utils/building';
import { use } from 'react';

const BuildingPage = () => {
  const { buildingFieldId } = useRouteSegments();
  const { currentVillage } = use(CurrentVillageContext);
  const buildingField = getBuildingFieldByBuildingFieldId(currentVillage, buildingFieldId!);
  const hasBuilding = !!buildingField;

  if (hasBuilding) {
    return <BuildingDetails />;
  }

  return <BuildingConstruction />;
};

export default BuildingPage;
