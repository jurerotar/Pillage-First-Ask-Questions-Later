import { BuildingField } from 'interfaces/models/game/village';
import React, { useState } from 'react';
import { buildings } from 'assets/buildings';
import { TabList, TabPanel, Tabs } from 'react-tabs';
import { Building, BuildingCategory, TribeBuildingRequirement } from 'interfaces/models/game/building';
import { useTranslation } from 'react-i18next';
import { StyledTab } from 'app/components/styled-tab';
import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';
import { useEvents } from 'app/[game]/hooks/use-events';
import { assessBuildingConstructionReadiness } from 'app/[game]/[village]/utils/building-requirements';
import { useVillages } from 'app/[game]/hooks/use-villages';
import { useTribe } from 'app/[game]/hooks/use-tribe';
import { Tribe } from 'interfaces/models/game/tribe';
import { BuildingCard } from 'app/[game]/[village]/components/building-card';
import { partition } from 'app/utils/common';

const getBuildingsBuildableByTribe = (buildingsToFilter: Building[], tribe: Tribe): Building[] => {
  return buildingsToFilter.filter(({ buildingRequirements }) => {
    const tribeRequirement = buildingRequirements.find(({ type }) => type === 'tribe') as TribeBuildingRequirement | undefined;
    return !tribeRequirement ? true : tribeRequirement.tribe === tribe;
  });
};

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
  const buildingBuildableByCurrentTribe = getBuildingsBuildableByTribe(buildingsByCategory, tribe);

  const [currentlyAvailableBuildings, currentlyUnavailableBuildings] = partition<Building>(
    buildingBuildableByCurrentTribe,
    ({ id: buildingId }: Building) => {
      const { canBuild } = assessBuildingConstructionReadiness({
        buildingId,
        tribe,
        currentVillageBuildingEvents,
        playerVillages,
        currentVillage,
      });
      return canBuild;
    },
  );

  const hasNoAvailableBuildings = buildingBuildableByCurrentTribe.length === 0;

  return (
    <div className="flex flex-col gap-8">
      {!hasNoAvailableBuildings && (
        <>
          {currentlyAvailableBuildings.length > 0 && (
            <section>
              Available buildings
              {currentlyAvailableBuildings.map((building: Building) => (
                <BuildingCard
                  location="building-construction-modal"
                  buildingId={building.id}
                  buildingFieldId={buildingFieldId}
                  key={building.id}
                />
              ))}
            </section>
          )}
          {currentlyUnavailableBuildings.length > 0 && (
            <section>
              Unavailable buildings
              {currentlyUnavailableBuildings.map((building: Building) => (
                <BuildingCard
                  location="building-construction-modal"
                  buildingId={building.id}
                  buildingFieldId={buildingFieldId}
                  key={building.id}
                />
              ))}
            </section>
          )}
        </>
      )}
      {hasNoAvailableBuildings && (
        <>No buildings available</>
      )}
    </div>
  )
};

type BuildingConstructionModalProps = {
  buildingFieldId: BuildingField['id'];
  modalCloseHandler: () => void;
}

export const BuildingConstructionModal: React.FC<BuildingConstructionModalProps> = ({ buildingFieldId, modalCloseHandler }) => {
  const { t } = useTranslation();

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
          buildingFieldId={buildingFieldId}
        />
      </TabPanel>
      <TabPanel>
        <BuildingCategoryPanel
          buildingCategory="military"
          buildingFieldId={buildingFieldId}
        />
      </TabPanel>
      <TabPanel>
        <BuildingCategoryPanel
          buildingCategory="resource-booster"
          buildingFieldId={buildingFieldId}
        />
      </TabPanel>
    </Tabs>
  );
};
