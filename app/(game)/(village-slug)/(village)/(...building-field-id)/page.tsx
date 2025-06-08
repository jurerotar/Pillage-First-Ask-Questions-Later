import { BuildingConstruction } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-construction';
import { BuildingDetails } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-details';
import { useRouteSegments } from 'app/(game)/(village-slug)/hooks/routes/use-route-segments';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { getBuildingFieldByBuildingFieldId } from 'app/(game)/(village-slug)/utils/building';
import type { MetaFunction } from 'react-router';
import { t } from 'i18next';
import { BuildingProvider } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/providers/building-provider';

export const meta: MetaFunction = ({ location, params }) => {
  const { serverSlug, villageSlug } = params;

  const { pathname } = location;

  const segments = pathname.split('/');
  const buildingFieldId = segments[segments.length - 1];

  return [
    {
      title: `${pathname.includes('resources') ? t('Resources') : t('Village')} - ${buildingFieldId} | Pillage First! - ${serverSlug} - ${villageSlug}`,
    },
  ];
};

const BuildingPage = () => {
  const { buildingFieldId } = useRouteSegments();
  const { currentVillage } = useCurrentVillage();
  const buildingField = getBuildingFieldByBuildingFieldId(currentVillage, buildingFieldId!);
  const hasBuilding = !!buildingField;

  if (hasBuilding) {
    return (
      <BuildingProvider buildingField={buildingField}>
        <BuildingDetails />
      </BuildingProvider>
    );
  }

  return <BuildingConstruction />;
};

export default BuildingPage;
