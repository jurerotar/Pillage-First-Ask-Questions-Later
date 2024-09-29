import { getBuildingDataForLevel } from 'app/[game]/utils/building';
import { GameEventType } from 'interfaces/models/events/game-event';
import type { Building } from 'interfaces/models/game/building';
import type { BuildingField } from 'interfaces/models/game/village';
import { villageMock } from 'mocks/game/village/village-mock';

type CreateBuildingConstructionEventMockArgs = {
  buildingId: Building['id'];
  buildingFieldId: BuildingField['id'];
  level: number;
};

export const createBuildingConstructionEventMock = ({ buildingId, buildingFieldId, level }: CreateBuildingConstructionEventMockArgs) => {
  const { building, currentLevelResourceCost, nextLevelBuildingDuration } = getBuildingDataForLevel(buildingId, level);

  return {
    id: 'id',
    type: GameEventType.BUILDING_LEVEL_CHANGE,
    villageId: villageMock.id,
    building,
    buildingFieldId,
    level,
    resourceCost: currentLevelResourceCost,
    startsAt: Date.now(),
    duration: nextLevelBuildingDuration,
  };
};
