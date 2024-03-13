import { BuildingField } from 'interfaces/models/game/village';
import React from 'react';
import { useCurrentVillage } from 'app/[game]/hooks/use-current-village';
import { getBuildingFieldByBuildingFieldId } from 'app/[game]/utils/common';
import { useCreateEvent } from 'app/[game]/hooks/use-events';
import { Button } from 'app/components/buttons/button';
import { GameEventType } from 'interfaces/models/events/game-event';

type BuildingUpgradeModalProps = {
  buildingFieldId: BuildingField['id'];
  modalCloseHandler: () => void;
}

export const BuildingUpgradeModal: React.FC<BuildingUpgradeModalProps> = ({ buildingFieldId, modalCloseHandler }) => {
  const createBuildingLevelChangeEvent = useCreateEvent(GameEventType.BUILDING_LEVEL_CHANGE);
  const createBuildingDestructionEvent = useCreateEvent(GameEventType.BUILDING_DESTRUCTION);
  const { currentVillage, currentVillageId } = useCurrentVillage();
  const building = getBuildingFieldByBuildingFieldId(currentVillage, buildingFieldId)!;

  const upgradeBuilding = () => {
    createBuildingLevelChangeEvent({
      resolvesAt: Date.now() + 5000,
      villageId: currentVillageId,
      buildingFieldId,
      level: building.level + 1
    });
  };

  const downgradeBuilding = () => {
    createBuildingLevelChangeEvent({
      resolvesAt: Date.now() + 5000,
      villageId: currentVillageId,
      buildingFieldId,
      level: building.level - 1
    });
  };

  const demolishBuilding = () => {
    createBuildingDestructionEvent({
      resolvesAt: Date.now() + 5000,
      villageId: currentVillageId,
      buildingFieldId,
    });
  };

  return (
    <>
      <Button onClick={upgradeBuilding}>Upgrade</Button>
      <Button onClick={downgradeBuilding}>Downgrade</Button>
      <Button onClick={demolishBuilding}>Destroy</Button>
    </>
  );
};
