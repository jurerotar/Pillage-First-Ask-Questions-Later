import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { unitsMap } from '@pillage-first/game-assets/units';
import { Text } from 'app/components/text';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb.tsx';

const WikiUnitPage = () => {
  const { unitId } = useParams();
  const { t } = useTranslation('public');

  const unit = unitsMap.get(unitId as any);

  if (!unit) {
    return <div>Unit not found</div>;
  }

  const unitName = t(`assets:UNITS.${unit.id}.NAME`, { defaultValue: unit.id });

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
            <Text className="font-medium">{unitName}</Text>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Text
        as="h1"
        className="text-3xl font-bold"
      >
        {unitName}
      </Text>

      <div className="prose dark:prose-invert max-w-none">
        <p>{t(`assets:UNITS.${unit.id}.DESCRIPTION`)}</p>

        <h3>Usage</h3>
        <p>{t(`assets:UNITS.${unit.id}.USAGE`)}</p>

        <h3>Stats</h3>
        <ul>
          <li>Attack: {unit.attack}</li>
          <li>Infantry Defence: {unit.infantryDefence}</li>
          <li>Cavalry Defence: {unit.cavalryDefence}</li>
          <li>Speed: {unit.unitSpeed}</li>
          <li>Carry Capacity: {unit.unitCarryCapacity}</li>
          <li>Wheat Consumption: {unit.unitWheatConsumption}</li>
        </ul>
      </div>
    </div>
  );
};

export default WikiUnitPage;
