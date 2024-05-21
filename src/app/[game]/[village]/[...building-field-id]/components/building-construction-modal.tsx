import { BuildingCard } from 'app/[game]/[village]/components/building-card';
import { type AssessedBuildingRequirement, assessBuildingConstructionReadiness } from 'app/[game]/[village]/utils/building-requirements';
import { useRouteSegments } from 'app/[game]/hooks/routes/use-route-segments';
import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';
import { useEvents } from 'app/[game]/hooks/use-events';
import { useTribe } from 'app/[game]/hooks/use-tribe';
import { useVillages } from 'app/[game]/hooks/use-villages';
import { StyledTab } from 'app/components/styled-tab';
import { buildings } from 'assets/buildings';
import clsx from 'clsx';
import type { AmountBuildingRequirement, Building, BuildingCategory, TribeBuildingRequirement } from 'interfaces/models/game/building';
import type { BuildingField } from 'interfaces/models/game/village';
import { partition } from 'lodash-es';
import type React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TabList, TabPanel, Tabs } from 'react-tabs';

type BuildingCategoryPanelProps = {
  buildingCategory: BuildingCategory;
  buildingFieldId: BuildingField['id'];
};

const BuildingCategoryPanel: React.FC<BuildingCategoryPanelProps> = ({ buildingCategory, buildingFieldId }) => {
  const { playerVillages } = useVillages();
  const { currentVillage } = useCurrentVillage();
  const { tribe } = useTribe();
  const { currentVillageBuildingEvents } = useEvents();

  const buildingsByCategory = buildings.filter(({ category }) => category === buildingCategory);

  const [currentlyAvailableBuildings, unavailableBuildings] = partition<Building>(buildingsByCategory, ({ id: buildingId }: Building) => {
    const { canBuild } = assessBuildingConstructionReadiness({
      buildingId,
      tribe,
      currentVillageBuildingEvents,
      playerVillages,
      currentVillage,
    });
    return canBuild;
  });

  const [currentlyUnavailableBuildings] = partition<Building>(unavailableBuildings, ({ id: buildingId }: Building) => {
    const { assessedRequirements } = assessBuildingConstructionReadiness({
      buildingId,
      tribe,
      currentVillageBuildingEvents,
      playerVillages,
      currentVillage,
    });

    const tribeRequirement = assessedRequirements.find(({ type }) => type === 'tribe') as TribeBuildingRequirement | undefined;
    const amountRequirement = assessedRequirements.find(({ type }) => type === 'amount') as
      | (AmountBuildingRequirement & AssessedBuildingRequirement)
      | undefined;

    // Other tribes' building or unique buildings can never be built again, so we filter them out
    return (
      (!tribeRequirement || tribeRequirement.tribe === tribe) &&
      !(amountRequirement && amountRequirement.amount === 1 && !amountRequirement.fulfilled)
    );
  });

  const hasNoAvailableBuildings = currentlyAvailableBuildings.length + currentlyUnavailableBuildings.length === 0;

  return (
    <div className="flex flex-col gap-8">
      {!hasNoAvailableBuildings && (
        <>
          {currentlyAvailableBuildings.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2>Available buildings</h2>
              {currentlyAvailableBuildings.map((building: Building, index) => (
                <div
                  className={clsx(index !== currentlyAvailableBuildings.length - 1 && 'border-b', 'border-gray-200')}
                  key={building.id}
                >
                  <BuildingCard
                    buildingId={building.id}
                    buildingFieldId={buildingFieldId}
                  />
                </div>
              ))}
            </section>
          )}
          {currentlyUnavailableBuildings.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2>Buildable in the future</h2>
              {currentlyUnavailableBuildings.map((building: Building, index) => (
                <div
                  className={clsx(index !== currentlyUnavailableBuildings.length - 1 && 'border-b', 'border-gray-200')}
                  key={building.id}
                >
                  <BuildingCard
                    buildingId={building.id}
                    buildingFieldId={buildingFieldId}
                  />
                </div>
              ))}
            </section>
          )}
        </>
      )}
      {hasNoAvailableBuildings && <p>No buildings available</p>}
    </div>
  );
};

export const BuildingConstructionModal: React.FC = () => {
  const { t } = useTranslation();
  const { buildingFieldId } = useRouteSegments();

  const [buildingTab, setBuildingTab] = useState<BuildingCategory>('infrastructure');

  return (
    <Tabs>
      <TabList className="flex">
        <StyledTab
          onSelect={() => setBuildingTab('infrastructure')}
          selected={buildingTab === 'infrastructure'}
        >
          {t('APP.GAME.VILLAGE.BUILDING_CONSTRUCTION_MODAL.TABS.INFRASTRUCTURE')}
        </StyledTab>
        <StyledTab
          onSelect={() => setBuildingTab('military')}
          selected={buildingTab === 'military'}
        >
          {t('APP.GAME.VILLAGE.BUILDING_CONSTRUCTION_MODAL.TABS.MILITARY')}
        </StyledTab>
        <StyledTab
          onSelect={() => setBuildingTab('resource-booster')}
          selected={buildingTab === 'resource-booster'}
        >
          {t('APP.GAME.VILLAGE.BUILDING_CONSTRUCTION_MODAL.TABS.RESOURCES')}
        </StyledTab>
      </TabList>
      <TabPanel>
        <BuildingCategoryPanel
          buildingCategory="infrastructure"
          buildingFieldId={buildingFieldId!}
        />
      </TabPanel>
      <TabPanel>
        <BuildingCategoryPanel
          buildingCategory="military"
          buildingFieldId={buildingFieldId!}
        />
      </TabPanel>
      <TabPanel>
        <BuildingCategoryPanel
          buildingCategory="resource-booster"
          buildingFieldId={buildingFieldId!}
        />
      </TabPanel>
    </Tabs>
  );
};
