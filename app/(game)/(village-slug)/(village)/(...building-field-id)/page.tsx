import { BuildingConstruction } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-construction';
import { BuildingDetails } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-details';
import { useRouteSegments } from 'app/(game)/(village-slug)/hooks/routes/use-route-segments';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { getBuildingFieldByBuildingFieldId } from 'app/(game)/(village-slug)/utils/building';
import { BuildingProvider } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/providers/building-provider';
import type { Route } from '.react-router/types/app/(game)/(village-slug)/(village)/(...building-field-id)/+types/page';
import type React from 'react';
import { useTranslation } from 'react-i18next';

const BuildingPage: React.FC<Route.ComponentProps> = ({ params }) => {
  const { serverSlug, villageSlug } = params;

  const { t } = useTranslation();
  const { buildingFieldId } = useRouteSegments();
  const { currentVillage } = useCurrentVillage();
  const buildingField = getBuildingFieldByBuildingFieldId(
    currentVillage,
    buildingFieldId!,
  );
  const hasBuilding = !!buildingField;

  const title = `${buildingFieldId! <= 18 ? t('Resources') : t('Village')} - ${buildingFieldId} | Pillage First! - ${serverSlug} - ${villageSlug}`;

  if (hasBuilding) {
    return (
      <>
        <title>{title}</title>
        <BuildingProvider buildingField={buildingField}>
          <BuildingDetails />
        </BuildingProvider>
      </>
    );
  }

  return (
    <>
      <title>{title}</title>
      <BuildingConstruction />
    </>
  );
};

export default BuildingPage;
