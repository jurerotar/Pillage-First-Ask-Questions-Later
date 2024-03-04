import { BuildingFieldId } from 'interfaces/models/game/village';
import React, { useState } from 'react';
import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';
import { buildings } from 'assets/buildings';
import { TabList, TabPanel, Tabs } from 'react-tabs';
import { Building, BuildingCategory } from 'interfaces/models/game/building';
import { useTranslation } from 'react-i18next';
import { StyledTab } from 'app/components/styled-tab';

type BuildingCategoryPanelProps = {
  buildingCategory: BuildingCategory;
};

const BuildingCategoryPanel: React.FC<BuildingCategoryPanelProps> = ({ buildingCategory }) => {
  const buildingsByCategory = buildings.filter(({ category }) => category === buildingCategory);

  return (
    <div className="flex flex-col gap-8">
      {buildingsByCategory.map((building: Building) => (
        <div
          className=""
          key={building.id}
        >
          {building.id}
        </div>
      ))}
    </div>
  )
};

type BuildingConstructionModalProps = {
  buildingFieldId: BuildingFieldId;
}

export const BuildingConstructionModal: React.FC<BuildingConstructionModalProps> = ({ buildingFieldId }) => {
  const { t } = useTranslation();
  const { currentVillage } = useCurrentVillage();

  const [buildingTab, setBuildingTab] = useState<BuildingCategory>('infrastructure');

  return (
    <Tabs>
      <TabList>
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
      <TabPanel><BuildingCategoryPanel buildingCategory="infrastructure"/></TabPanel>
      <TabPanel><BuildingCategoryPanel buildingCategory="military"/></TabPanel>
      <TabPanel><BuildingCategoryPanel buildingCategory="resource-booster"/></TabPanel>
    </Tabs>
  );
};
