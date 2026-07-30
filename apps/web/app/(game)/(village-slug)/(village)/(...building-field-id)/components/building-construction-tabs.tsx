import { use, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { buildings } from '@pillage-first/game-assets/buildings';
import type { Building } from '@pillage-first/types/models/building';
import { partition } from '@pillage-first/utils/array';
import { assessBuildingRequirements } from '@pillage-first/utils/game/building-requirements';
import {
  BuildingActions,
  BuildingBenefits,
  BuildingCard,
  BuildingCost,
  BuildingOverview,
  BuildingRequirements,
  BuildingUnfinishedNotice,
} from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-card';
import { BuildingFieldContext } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/providers/building-field-context';
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import { CurrentVillageBuildingQueueContext } from 'app/(game)/(village-slug)/providers/current-village-building-queue-context';
import { InformationPopover } from 'app/(game)/components/information-popover';
import { Text } from 'app/components/text';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from 'app/components/ui/breadcrumb';
import { Tab, TabList, TabPanel, Tabs } from 'app/components/ui/tabs';

const tabs = ['infrastructure', 'military', 'resources'];

type BuildingCategoryPanelProps = {
  buildingCategory: Building['category'];
};

const BuildingConstructionList = ({
  buildingCategory,
}: BuildingCategoryPanelProps) => {
  const { t } = useTranslation();
  const tribe = useTribe();
  const { buildingFieldId, maxLevelByBuildingId, buildingIdsInQueue } =
    use(BuildingFieldContext);
  const { getBuildingEventQueue } = use(CurrentVillageBuildingQueueContext);

  const shouldAllowUnmetRequirementsForScheduledConstruction =
    getBuildingEventQueue(buildingFieldId).length > 0;

  const buildingsByCategory = useMemo(() => {
    return buildings.filter(({ category }) => category === buildingCategory);
  }, [buildingCategory]);

  const assessments = useMemo(() => {
    return new Map<
      Building['id'],
      ReturnType<typeof assessBuildingRequirements>
    >(
      buildingsByCategory.map((building) => [
        building.id,
        assessBuildingRequirements({
          building,
          tribe,
          maxLevelByBuildingId,
          buildingIdsInQueue,
        }),
      ]),
    );
  }, [buildingsByCategory, tribe, maxLevelByBuildingId, buildingIdsInQueue]);

  const availableBuildings = useMemo(() => {
    return buildingsByCategory.filter((building) => {
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
  }, [buildingsByCategory, assessments, tribe]);

  const sortedAvailableBuildings = useMemo(() => {
    const [buildableBuildings, nonBuildableBuildings] = partition(
      availableBuildings,
      (building) => assessments.get(building.id)!.canBuild,
    );

    return [...buildableBuildings, ...nonBuildableBuildings];
  }, [availableBuildings, assessments]);

  const hasNoAvailableBuildings = availableBuildings.length === 0;

  return (
    <SectionContent>
      {hasNoAvailableBuildings && <Text>{t('No buildings available')}</Text>}
      {!hasNoAvailableBuildings && (
        <section className="flex flex-col gap-2">
          {sortedAvailableBuildings.map((building: Building) => (
            <div
              key={building.id}
              className="p-2 border border-border"
            >
              <BuildingCard
                buildingId={building.id}
                buildingConstructionReadinessAssessment={assessments.get(
                  building.id,
                )}
                shouldAllowUnmetRequirementsForScheduledConstruction={
                  shouldAllowUnmetRequirementsForScheduledConstruction
                }
              >
                <BuildingOverview />
                <BuildingUnfinishedNotice />
                <BuildingBenefits />
                <BuildingCost />
                <BuildingActions />
                <BuildingRequirements />
              </BuildingCard>
            </div>
          ))}
        </section>
      )}
    </SectionContent>
  );
};

export const BuildingConstructionTabs = () => {
  const { t } = useTranslation();
  const { buildingFieldId } = use(BuildingFieldContext);

  const { tabIndex, navigateToTab } = useTabParam(
    tabs,
    'building-construction-tab',
    tabs[0],
  );

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
      <InformationPopover
        ariaLabel={t('Construct new building')}
        className="top-2 right-2"
      >
        <Text>
          {t(
            'Choose an infrastructure, military or resource building to construct on this empty building field.',
          )}
        </Text>
      </InformationPopover>
      <div className="flex justify-between items-center">
        <Text as="h1">{t('Construct new building')}</Text>
      </div>
      <Tabs
        value={tabs[tabIndex] ?? tabs[0]}
        onValueChange={(value) => {
          navigateToTab(value);
        }}
      >
        <TabList>
          <Tab value="infrastructure">{t('Infrastructure')}</Tab>
          <Tab value="military">{t('Military')}</Tab>
          <Tab value="resources">{t('Resources')}</Tab>
        </TabList>
        <TabPanel value="infrastructure">
          <Section>
            <SectionContent>
              <InformationPopover ariaLabel={t('Infrastructure buildings')}>
                <Text>
                  {t(
                    'Buildings focused on providing village services, growth and utility. They generally support administration and logistics rather than producing raw resources.',
                  )}
                </Text>
              </InformationPopover>
              <Text as="h2">{t('Infrastructure buildings')}</Text>
            </SectionContent>
            <SectionContent>
              <BuildingConstructionList buildingCategory="infrastructure" />
            </SectionContent>
          </Section>
        </TabPanel>
        <TabPanel value="military">
          <Section>
            <SectionContent>
              <InformationPopover ariaLabel={t('Military buildings')}>
                <Text>
                  {t(
                    'Buildings focused on raising, upgrading and supporting armed forces and village defense. This category covers training, unit production, upgrades and defensive capabilities that increase a village’s combat effectiveness.',
                  )}
                </Text>
              </InformationPopover>
              <Text as="h2">{t('Military buildings')}</Text>
            </SectionContent>
            <SectionContent>
              <BuildingConstructionList buildingCategory="military" />
            </SectionContent>
          </Section>
        </TabPanel>
        <TabPanel value="resources">
          <Section>
            <SectionContent>
              <InformationPopover ariaLabel={t('Resource buildings')}>
                <Text>
                  {t('Buildings focused on improving village economy.')}
                </Text>
              </InformationPopover>
              <Text as="h2">{t('Resource buildings')}</Text>
            </SectionContent>
            <SectionContent>
              <BuildingConstructionList buildingCategory="resource-booster" />
            </SectionContent>
          </Section>
        </TabPanel>
      </Tabs>
    </>
  );
};
