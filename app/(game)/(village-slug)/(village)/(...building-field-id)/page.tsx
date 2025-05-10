import { BuildingConstruction } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-construction';
import { BuildingDetails } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-details';
import { useRouteSegments } from 'app/(game)/(village-slug)/hooks/routes/use-route-segments';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { getBuildingFieldByBuildingFieldId } from 'app/(game)/(village-slug)/utils/building';
import type { LinksFunction, MetaFunction } from 'react-router';
import villageAssetsPreloadPaths from 'app/asset-preload-paths/village.json';
import { t } from 'i18next';

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

export const links: LinksFunction = () => {
  const { files } = villageAssetsPreloadPaths;

  return files.map((href) => ({
    rel: 'preload',
    href,
    as: 'image',
    type: 'image/avif',
  }));
};

const BuildingPage = () => {
  const { buildingFieldId } = useRouteSegments();
  const { currentVillage } = useCurrentVillage();
  const buildingField = getBuildingFieldByBuildingFieldId(currentVillage, buildingFieldId!);
  const hasBuilding = !!buildingField;

  if (hasBuilding) {
    return <BuildingDetails />;
  }

  return <BuildingConstruction />;
};

export default BuildingPage;
