import { BuildingCard } from 'app/(game)/(village)/components/building-card';
import { assessBuildingConstructionReadiness, type AssessedBuildingRequirement } from 'app/(game)/(village)/utils/building-requirements';
import { useRouteSegments } from 'app/(game)/hooks/routes/use-route-segments';
import { useCurrentVillage } from 'app/(game)/hooks/use-current-village';
import { useEvents } from 'app/(game)/hooks/use-events';
import { useTribe } from 'app/(game)/hooks/use-tribe';
import { useVillages } from 'app/(game)/hooks/use-villages';
import { buildings } from 'app/assets/buildings';
import { StyledTab } from 'app/components/styled-tab';
import type { AmountBuildingRequirement, Building, BuildingCategory, TribeBuildingRequirement } from 'app/interfaces/models/game/building';
import type { BuildingField } from 'app/interfaces/models/game/village';
import { partition } from 'app/utils/common';
import type React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TabList, TabPanel, Tabs } from 'react-tabs';
import { useArtifacts } from 'app/(game)/hooks/use-artifacts';

type BuildingCategoryPanelProps = {
  buildingCategory: BuildingCategory;
  buildingFieldId: BuildingField['id'];
};

const BuildingCategoryPanel: React.FC<BuildingCategoryPanelProps> = ({ buildingCategory }) => {
  const { t } = useTranslation();
  const { playerVillages } = useVillages();
  const { currentVillage } = useCurrentVillage();
  const { tribe } = useTribe();
  const { currentVillageBuildingEvents } = useEvents();
  const { hasGreatBuildingsArtifact } = useArtifacts();

  const buildingsByCategory = buildings.filter(({ category }) => category === buildingCategory);

  const [currentlyAvailableBuildings, unavailableBuildings] = partition<Building>(buildingsByCategory, ({ id: buildingId }: Building) => {
    const { canBuild } = assessBuildingConstructionReadiness({
      buildingId,
      tribe,
      currentVillageBuildingEvents,
      playerVillages,
      currentVillage,
      hasGreatBuildingsArtifact,
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
      hasGreatBuildingsArtifact,
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
    <div className="flex flex-col gap-4 pt-2">
      {!hasNoAvailableBuildings && (
        <>
          {currentlyAvailableBuildings.length > 0 && (
            <section className="flex flex-col gap-2 mb-2">
              <h2 className="text-xl">{t('APP.GAME.BUILDING_FIELD.BUILDING_CONSTRUCTION.AVAILABLE_BUILDINGS')}</h2>
              {currentlyAvailableBuildings.map((building: Building) => (
                <BuildingCard
                  key={building.id}
                  buildingId={building.id}
                />
              ))}
            </section>
          )}
          {currentlyUnavailableBuildings.length > 0 && (
            <section className="flex flex-col gap-2 mb-2">
              <h2 className="text-xl">{t('APP.GAME.BUILDING_FIELD.BUILDING_CONSTRUCTION.CURRENTLY_NON-AVAILABLE_BUILDINGS')}</h2>
              {currentlyUnavailableBuildings.map((building: Building) => (
                <BuildingCard
                  key={building.id}
                  buildingId={building.id}
                />
              ))}
            </section>
          )}
        </>
      )}
      {hasNoAvailableBuildings && <p>{t('APP.GAME.BUILDING_FIELD.BUILDING_CONSTRUCTION.NO_AVAILABLE_BUILDINGS')}</p>}
    </div>
  );
};

export const BuildingConstruction: React.FC = () => {
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
          {t('APP.GAME.BUILDING_FIELD.BUILDING_CONSTRUCTION.TABS.INFRASTRUCTURE')}
        </StyledTab>
        <StyledTab
          onSelect={() => setBuildingTab('military')}
          selected={buildingTab === 'military'}
        >
          {t('APP.GAME.BUILDING_FIELD.BUILDING_CONSTRUCTION.TABS.MILITARY')}
        </StyledTab>
        <StyledTab
          onSelect={() => setBuildingTab('resource-booster')}
          selected={buildingTab === 'resource-booster'}
        >
          {t('APP.GAME.BUILDING_FIELD.BUILDING_CONSTRUCTION.TABS.RESOURCES')}
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
