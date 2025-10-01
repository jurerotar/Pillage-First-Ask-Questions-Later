import { BuildingConstruction } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-construction';
import { BuildingDetails } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-details';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { getBuildingFieldByBuildingFieldId } from 'app/assets/utils/buildings';
import { BuildingFieldProvider } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/providers/building-field-provider';
import type { Route } from '.react-router/types/app/(game)/(village-slug)/(village)/(...building-field-id)/+types/page';
import { useTranslation } from 'react-i18next';
import { buildingFieldIdIsInRangeMiddleware } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/middlewares/building-field-id-in-range-middleware';

export const clientMiddleware = [buildingFieldIdIsInRangeMiddleware];

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

  return (
    <>
      <title>{title}</title>
      <BuildingFieldProvider
        buildingFieldId={buildingFieldId}
        buildingField={buildingField}
      >
        {hasBuilding && <BuildingDetails />}
        {!hasBuilding && <BuildingConstruction />}
      </BuildingFieldProvider>
    </>
  );
};

export default BuildingPage;
