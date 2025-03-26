import { BuildingCard } from 'app/(game)/(village-slug)/(village)/components/building-card';
import {
  assessBuildingConstructionReadiness,
  type AssessedBuildingRequirement,
} from 'app/(game)/(village-slug)/(village)/utils/building-requirements';
import { useCurrentVillage } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import { buildings } from 'app/(game)/(village-slug)/assets/buildings';
import { StyledTab } from 'app/components/styled-tab';
import type { AmountBuildingRequirement, Building, BuildingCategory, TribeBuildingRequirement } from 'app/interfaces/models/game/building';
import { partition } from 'app/utils/common';
import type React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TabList, TabPanel, Tabs } from 'react-tabs';
import { useArtifacts } from 'app/(game)/(village-slug)/hooks/use-artifacts';
import { useCurrentVillageBuildingEvents } from 'app/(game)/(village-slug)/hooks/current-village/use-current-village-building-events';
import { usePlayerVillages } from 'app/(game)/(village-slug)/hooks/use-player-villages';

type BuildingCategoryPanelProps = {
  buildingCategory: BuildingCategory;
};

const BuildingCategoryPanel: React.FC<BuildingCategoryPanelProps> = ({ buildingCategory }) => {
  const { t } = useTranslation();
  const { playerVillages } = usePlayerVillages();
  const { currentVillage } = useCurrentVillage();
  const { tribe } = useTribe();
  const { currentVillageBuildingEvents } = useCurrentVillageBuildingEvents();
  const { isGreatBuildingsArtifactActive } = useArtifacts();

  const buildingsByCategory = buildings.filter(({ category }) => category === buildingCategory);

  const [currentlyAvailableBuildings, unavailableBuildings] = partition<Building>(buildingsByCategory, ({ id: buildingId }: Building) => {
    const { canBuild } = assessBuildingConstructionReadiness({
      buildingId,
      tribe,
      currentVillageBuildingEvents,
      playerVillages,
      currentVillage,
      isGreatBuildingsArtifactActive,
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
      isGreatBuildingsArtifactActive,
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
              <h2 className="text-xl">{t('Available buildings')}</h2>
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
              <h2 className="text-xl">{t('Buildable in the future')}</h2>
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
      {hasNoAvailableBuildings && <p>{t('No buildings available')}</p>}
    </div>
  );
};

export const BuildingConstruction = () => {
  const { t } = useTranslation();

  const [buildingTab, setBuildingTab] = useState<BuildingCategory>('infrastructure');

  return (
    <Tabs>
      <TabList className="flex">
        <StyledTab
          onSelect={() => setBuildingTab('infrastructure')}
          selected={buildingTab === 'infrastructure'}
        >
          {t('Infrastructure')}
        </StyledTab>
        <StyledTab
          onSelect={() => setBuildingTab('military')}
          selected={buildingTab === 'military'}
        >
          {t('Military')}
        </StyledTab>
        <StyledTab
          onSelect={() => setBuildingTab('resource-booster')}
          selected={buildingTab === 'resource-booster'}
        >
          {t('Resources')}
        </StyledTab>
      </TabList>
      <TabPanel>
        <BuildingCategoryPanel buildingCategory="infrastructure" />
      </TabPanel>
      <TabPanel>
        <BuildingCategoryPanel buildingCategory="military" />
      </TabPanel>
      <TabPanel>
        <BuildingCategoryPanel buildingCategory="resource-booster" />
      </TabPanel>
    </Tabs>
  );
};
