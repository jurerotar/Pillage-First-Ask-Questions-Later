import { useTranslation } from 'react-i18next';
import { getBuildingFieldByBuildingFieldId } from '@pillage-first/game-assets/utils/buildings';
import type { Route } from '@react-router/types/app/(game)/(village-slug)/(village)/(...building-field-id)/+types/page';
import { BuildingConstruction } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-construction';
import { BuildingDetails } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-details';
import { buildingFieldIdIsInRangeMiddleware } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/middlewares/building-field-id-in-range-middleware';
import { BuildingFieldProvider } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/providers/building-field-provider';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';

export const clientMiddleware: Route.ClientMiddlewareFunction[] = [
  buildingFieldIdIsInRangeMiddleware,
];

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

  const title = `${buildingFieldId <= 18 ? t('Resources') : t('Village')} - ${buildingFieldId} | Pillage First! - ${serverSlug} - ${villageSlug}`;

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
