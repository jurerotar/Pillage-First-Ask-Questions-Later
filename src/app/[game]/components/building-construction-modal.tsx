import { BuildingField } from 'interfaces/models/game/village';
import React, { useState } from 'react';
import { buildings } from 'assets/buildings';
import { TabList, TabPanel, Tabs } from 'react-tabs';
import { Building, BuildingCategory, BuildingId } from 'interfaces/models/game/building';
import { useTranslation } from 'react-i18next';
import { StyledTab } from 'app/components/styled-tab';
import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';
import { useCreateEvent } from 'app/[game]/hooks/use-events';
import { GameEventType } from 'interfaces/models/events/game-event';
import { Button } from 'app/components/buttons/button';

type BuildingCategoryPanelProps = {
  buildingCategory: BuildingCategory;
  buildingFieldId: BuildingField['id'];
};

const BuildingCategoryPanel: React.FC<BuildingCategoryPanelProps> = ({ buildingCategory, buildingFieldId }) => {
  const { t } = useTranslation();
  const { currentVillageId } = useCurrentVillage();
  const createBuildingConstructionEvent = useCreateEvent(GameEventType.BUILDING_CONSTRUCTION);

  const buildingsByCategory = buildings.filter(({ category }) => category === buildingCategory);

  const hasNoAvailableBuildings = buildingCategory.length === 0;

  const constructBuilding = (buildingId: BuildingId) => {
    createBuildingConstructionEvent({
      buildingFieldId,
      buildingId,
      villageId: currentVillageId,
      resolvesAt: Date.now() + 5000
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {buildingsByCategory.map((building: Building) => (
        <div
          className="flex justify-between border-b-2 border-gray-300 py-2"
          key={building.id}
        >
          <div className="flex flex-col gap-2">
            <span className="font-medium">
              {t(`BUILDINGS.${building.id}.NAME`)}
            </span>
            <span className="">
              {t(`BUILDINGS.${building.id}.DESCRIPTION`)}
            </span>
            <Button onClick={() => constructBuilding(building.id)}>
              Construct
            </Button>
          </div>
        </div>
      ))}
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
