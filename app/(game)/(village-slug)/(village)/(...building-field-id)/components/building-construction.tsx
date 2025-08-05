import {
  BuildingBenefits,
  BuildingCard,
  BuildingCost,
  BuildingOverview,
  BuildingRequirements,
} from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-card';
import {
  assessBuildingConstructionReadiness,
  type AssessedBuildingRequirement,
} from 'app/(game)/(village-slug)/(village)/utils/building-requirements';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import { buildings } from 'app/(game)/(village-slug)/assets/buildings';
import type {
  AmountBuildingRequirement,
  Building,
  BuildingCategory,
  TribeBuildingRequirement,
} from 'app/interfaces/models/game/building';
import { partition } from 'app/utils/common';
import type React from 'react';
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
import { useGameNavigation } from 'app/(game)/(village-slug)/hooks/routes/use-game-navigation';
import { BuildingActions } from 'app/(game)/(village-slug)/(village)/(...building-field-id)/components/building-actions';
import { CurrentVillageBuildingQueueContext } from 'app/(game)/(village-slug)/providers/current-village-building-queue-provider';

type BuildingCategoryPanelProps = {
  buildingCategory: BuildingCategory;
};

const BuildingCategoryPanel: React.FC<BuildingCategoryPanelProps> = ({
  buildingCategory,
}) => {
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

  const [currentlyAvailableBuildings] = partition<Building>(
    buildingsByCategory,
    ({ id: buildingId }: Building) => {
      const { assessedRequirements } = assessBuildingConstructionReadiness({
        buildingId,
        ...staticBuildingConstructionReadinessArgs,
      });

      const tribeRequirement = assessedRequirements.find(
        ({ type }) => type === 'tribe',
      ) as TribeBuildingRequirement | undefined;
      const amountRequirement = assessedRequirements.find(
        ({ type }) => type === 'amount',
      ) as
        | (AmountBuildingRequirement & AssessedBuildingRequirement)
        | undefined;

      // Other tribes' building or unique buildings can never be built again, so we filter them out
      return (
        (!tribeRequirement || tribeRequirement.tribe === tribe) &&
        !(
          amountRequirement &&
          amountRequirement.amount === 1 &&
          !amountRequirement.fulfilled
        )
      );
    },
  );

  // TODO: There's probably a better way of handling this instead of repeating assessBuildingConstructionReadiness 3 times
  const sortedAvailableBuildings = currentlyAvailableBuildings.toSorted(
    (prev, next) => {
      const prevAssessment = assessBuildingConstructionReadiness({
        buildingId: prev.id,
        ...staticBuildingConstructionReadinessArgs,
      });

      const nextAssessment = assessBuildingConstructionReadiness({
        buildingId: next.id,
        ...staticBuildingConstructionReadinessArgs,
      });

      // Sort buildings where all requirements are fulfilled first
      return Number(nextAssessment.canBuild) - Number(prevAssessment.canBuild);
    },
  );

  const hasNoAvailableBuildings = currentlyAvailableBuildings.length === 0;

  return (
    <div className="flex flex-col gap-2 pt-2">
      {hasNoAvailableBuildings && <p>{t('No buildings available')}</p>}
      {!hasNoAvailableBuildings && (
        <section className="flex flex-col gap-2 mb-2">
          {sortedAvailableBuildings.map((building: Building) => (
            <BuildingCard
              key={building.id}
              buildingId={building.id}
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
    </div>
  );
};

export const BuildingConstruction = () => {
  const { t } = useTranslation();
  const { villagePath } = useGameNavigation();

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to={villagePath}>{t('Village')}</BreadcrumbLink>
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
          <article className="flex flex-col gap-2">
            <Text as="h2">{t('Infrastructure buildings')}</Text>
            <BuildingCategoryPanel buildingCategory="infrastructure" />
          </article>
        </TabPanel>
        <TabPanel>
          <article className="flex flex-col gap-2">
            <Text as="h2">{t('Military buildings')}</Text>
            <BuildingCategoryPanel buildingCategory="military" />
          </article>
        </TabPanel>
        <TabPanel>
          <article className="flex flex-col gap-2">
            <Text as="h2">{t('Resource buildings')}</Text>
            <BuildingCategoryPanel buildingCategory="resource-booster" />
          </article>
        </TabPanel>
      </Tabs>
    </>
  );
};
