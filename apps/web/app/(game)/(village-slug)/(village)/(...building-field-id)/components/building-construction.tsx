import { use, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { buildings } from '@pillage-first/game-assets/buildings';
import type { Building } from '@pillage-first/types/models/building';
import { partition } from '@pillage-first/utils/array';
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
import {
  Section,
  SectionContent,
} from 'app/(game)/(village-slug)/components/building-layout';
import { useTabParam } from 'app/(game)/(village-slug)/hooks/routes/use-tab-param';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
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

const BuildingCategoryPanel = ({
  buildingCategory,
}: BuildingCategoryPanelProps) => {
  const { t } = useTranslation();
  const tribe = useTribe();
  const { maxLevelByBuildingId, buildingIdsInQueue } =
    use(BuildingFieldContext);

  const buildingsByCategory = useMemo(() => {
    return buildings.filter(({ category }) => category === buildingCategory);
  }, [buildingCategory]);

  const assessments = useMemo(() => {
    return new Map<
      Building['id'],
      ReturnType<typeof assessBuildingConstructionReadiness>
    >(
      buildingsByCategory.map((building) => [
        building.id,
        assessBuildingConstructionReadiness({
          buildingId: building.id,
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
              <BuildingCategoryPanel buildingCategory="infrastructure" />
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
              <BuildingCategoryPanel buildingCategory="military" />
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
              <BuildingCategoryPanel buildingCategory="resource-booster" />
            </SectionContent>
          </Section>
        </TabPanel>
      </Tabs>
    </>
  );
};
