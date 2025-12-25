import { use, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BuildingActions } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-actions';
import {
  BuildingBenefits,
  BuildingCard,
  BuildingCost,
  BuildingOverview,
  BuildingRequirements,
  BuildingUnfinishedNotice,
} from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-card';
import { BuildingFieldContext } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/providers/building-field-provider';
import { assessBuildingConstructionReadiness } from 'app/(game)/(village-slug)/(village)/utils/building-requirements';
import { SectionContent } from 'app/(game)/(village-slug)/components/building-layout';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import { buildings } from 'app/assets/buildings';
import { Text } from 'app/components/text';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';
import type { Building } from 'app/interfaces/models/game/building';

type BuildingCategoryPanelProps = {
  buildingCategory: Building['category'];
};

const BuildingCategoryPanel = ({
  buildingCategory,
}: BuildingCategoryPanelProps) => {
  const { t } = useTranslation();
  const tribe = useTribe();
  const { maxLevelByBuildingId, buildingIdsInQueue } =
    use(BuildingFieldContext);

  const staticBuildingConstructionReadinessArgs: Omit<
    Parameters<typeof assessBuildingConstructionReadiness>[0],
    'buildingId'
  > = {
    tribe,
    maxLevelByBuildingId,
    buildingIdsInQueue,
  };

  const buildingsByCategory = useMemo(() => {
    return buildings.filter(({ category }) => category === buildingCategory);
  }, [buildingCategory]);

  const assessments = new Map<
    Building['id'],
    ReturnType<typeof assessBuildingConstructionReadiness>
  >(
    buildingsByCategory.map((building) => [
      building.id,
      assessBuildingConstructionReadiness({
        buildingId: building.id,
        ...staticBuildingConstructionReadinessArgs,
      }),
    ]),
  );

  const availableBuildings = buildingsByCategory.filter((building) => {
    const buildingConstructionReadinessAssessment = assessments.get(
      building.id,
    )!;

    if (buildingConstructionReadinessAssessment.canBuild) {
      return true;
    }

    for (const assessment of buildingConstructionReadinessAssessment.assessedRequirements) {
      if (
        (assessment.type === 'tribe' && assessment.tribe !== tribe) ||
        (assessment.type === 'amount' &&
          assessment.amount === 1 &&
          !assessment.fulfilled)
      ) {
        return false;
      }
    }

    return true;
  });

  const sortedAvailableBuildings = availableBuildings.toSorted((prev, next) => {
    const prevAssessment = assessments.get(prev.id)!;
    const nextAssessment = assessments.get(next.id)!;

    return Number(nextAssessment.canBuild) - Number(prevAssessment.canBuild);
  });

  const hasNoAvailableBuildings = availableBuildings.length === 0;

  return (
    <SectionContent>
      {hasNoAvailableBuildings && <p>{t('No buildings available')}</p>}
      {!hasNoAvailableBuildings && (
        <section className="flex flex-col gap-2 *:border *:border-border *:p-2">
          {sortedAvailableBuildings.map((building: Building) => (
            <BuildingCard
              key={building.id}
              buildingId={building.id}
              buildingConstructionReadinessAssessment={assessments.get(
                building.id,
              )}
            >
              <BuildingOverview />
              <BuildingUnfinishedNotice />
              <BuildingBenefits />
              <BuildingCost />
              <BuildingActions />
              <BuildingRequirements />
            </BuildingCard>
          ))}
        </section>
      )}
    </SectionContent>
  );
};

export const BuildingConstruction = () => {
  const { t } = useTranslation();
  const { buildingFieldId } = use(BuildingFieldContext);

  const backlinkTarget = buildingFieldId > 18 ? '../village' : '../resources';

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to={backlinkTarget}>{t('Village')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>{t('Construct new building')}</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Text as="h1">{t('Construct new building')}</Text>
      <Tabs>
        <TabList>
          <Tab>{t('Infrastructure')}</Tab>
          <Tab>{t('Military')}</Tab>
          <Tab>{t('Resources')}</Tab>
        </TabList>
        <TabPanel>
          <SectionContent>
            <Text as="h2">{t('Infrastructure buildings')}</Text>
            <Text>
              {t(
                'Buildings focused on providing village services, growth and utility. They generally support administration and logistics rather than producing raw resources.',
              )}
            </Text>
            <BuildingCategoryPanel buildingCategory="infrastructure" />
          </SectionContent>
        </TabPanel>
        <TabPanel>
          <SectionContent>
            <Text as="h2">{t('Military buildings')}</Text>
            <Text>
              {t(
                'Buildings focused on raising, upgrading and supporting armed forces and village defense. This category covers training, unit production, upgrades and defensive capabilities that increase a village’s combat effectiveness.',
              )}
            </Text>
            <BuildingCategoryPanel buildingCategory="military" />
          </SectionContent>
        </TabPanel>
        <TabPanel>
          <SectionContent>
            <Text as="h2">{t('Resource buildings')}</Text>
            <Text>{t('Buildings focused on improving village economy.')}</Text>
            <BuildingCategoryPanel buildingCategory="resource-booster" />
          </SectionContent>
        </TabPanel>
      </Tabs>
    </>
  );
};
