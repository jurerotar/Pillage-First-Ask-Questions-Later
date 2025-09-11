import {
  BuildingBenefits,
  BuildingCard,
  BuildingCost,
  BuildingOverview,
  BuildingRequirements,
} from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-card';
import { assessBuildingConstructionReadiness } from 'app/(game)/(village-slug)/(village)/utils/building-requirements';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import { buildings } from 'app/assets/buildings';
import type {
  Building,
  BuildingCategory,
} from 'app/interfaces/models/game/building';

import { use } from 'react';
import { useTranslation } from 'react-i18next';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';
import { useArtifacts } from 'app/(game)/(village-slug)/hooks/use-artifacts';
import { usePlayerVillages } from 'app/(game)/(village-slug)/hooks/use-player-villages';
import { Text } from 'app/components/text';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import { BuildingActions } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-actions';
import { CurrentVillageBuildingQueueContext } from 'app/(game)/(village-slug)/providers/current-village-building-queue-provider';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { BuildingFieldContext } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/providers/building-field-provider';

type BuildingCategoryPanelProps = {
  buildingCategory: BuildingCategory;
};

const BuildingCategoryPanel = ({
  buildingCategory,
}: BuildingCategoryPanelProps) => {
  const { t } = useTranslation();
  const { playerVillages } = usePlayerVillages();
  const { currentVillage } = useCurrentVillage();
  const tribe = useTribe();
  const { currentVillageBuildingEvents } = use(
    CurrentVillageBuildingQueueContext,
  );
  const { isGreatBuildingsArtifactActive } = useArtifacts();

  const staticBuildingConstructionReadinessArgs: Omit<
    Parameters<typeof assessBuildingConstructionReadiness>[0],
    'buildingId'
  > = {
    tribe,
    currentVillageBuildingEvents,
    playerVillages,
    currentVillage,
    isGreatBuildingsArtifactActive,
  };

  const buildingsByCategory = buildings.filter(
    ({ category }) => category === buildingCategory,
  );

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
        <section className="flex flex-col gap-2 mb-2">
          {sortedAvailableBuildings.map((building: Building) => (
            <BuildingCard
              key={building.id}
              buildingId={building.id}
              buildingConstructionReadinessAssessment={
                assessments.get(building.id)!
              }
            >
              <BuildingOverview />
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
          <Section>
            <Text as="h2">{t('Infrastructure buildings')}</Text>
            <BuildingCategoryPanel buildingCategory="infrastructure" />
          </Section>
        </TabPanel>
        <TabPanel>
          <Section>
            <Text as="h2">{t('Military buildings')}</Text>
            <BuildingCategoryPanel buildingCategory="military" />
          </Section>
        </TabPanel>
        <TabPanel>
          <Section>
            <Text as="h2">{t('Resource buildings')}</Text>
            <BuildingCategoryPanel buildingCategory="resource-booster" />
          </Section>
        </TabPanel>
      </Tabs>
    </>
  );
};
