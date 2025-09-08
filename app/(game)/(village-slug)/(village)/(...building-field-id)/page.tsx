import { BuildingConstruction } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-construction';
import { BuildingDetails } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-details';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { getBuildingFieldByBuildingFieldId } from 'app/(game)/(village-slug)/utils/building';
import { BuildingProvider } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/providers/building-provider';
import type { Route } from '.react-router/types/app/(game)/(village-slug)/(village)/(...building-field-id)/+types/page';
import { useTranslation } from 'react-i18next';

const BuildingPage = ({ params }: Route.ComponentProps) => {
  const {
    serverSlug,
    villageSlug,
    buildingFieldId: buildingFieldIdParam,
  } = params;

  const buildingFieldId = Number.parseInt(buildingFieldIdParam, 10);

  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();
  const buildingField = getBuildingFieldByBuildingFieldId(
    currentVillage,
    buildingFieldId,
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
