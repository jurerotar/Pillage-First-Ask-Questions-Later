import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { buildingMap } from '@pillage-first/game-assets/buildings';
import { Text } from 'app/components/text';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb.tsx';

const WikiBuildingPage = () => {
  const { buildingId } = useParams();
  const { t } = useTranslation(['public', 'assets']);

  const building = buildingMap.get(buildingId as any);

  if (!building) {
    return <div>Building not found</div>;
  }

  const buildingName = t(`assets:BUILDINGS.${building.id}.NAME`, {
    defaultValue: building.id,
  });

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/">{t('public:Home')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink to="/wiki">{t('public:Wiki')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <Text className="font-medium">{buildingName}</Text>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Text
        as="h1"
        className="text-3xl font-bold"
      >
        {buildingName}
      </Text>

      <div className="prose dark:prose-invert max-w-none">
        <p>{t(`assets:BUILDINGS.${building.id}.DESCRIPTION`)}</p>

        <h3>Stats</h3>
        <ul>
          <li>Category: {building.category}</li>
          <li>Max Level: {building.maxLevel}</li>
          <li>Population Coefficient: {building.populationCoefficient}</li>
          <li>
            Culture Points Coefficient: {building.culturePointsCoefficient}
          </li>
        </ul>
      </div>
    </div>
  );
};

export default WikiBuildingPage;
