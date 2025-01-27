import { getBuildingDataForLevel } from 'app/(game)/utils/building';
import type { Building } from 'app/interfaces/models/game/building';
import type { BuildingField } from 'app/interfaces/models/game/village';
import { villageMock } from 'app/tests/mocks/game/village/village-mock';
import type { GameEvent } from 'app/interfaces/models/game/game-event';

type CreateBuildingConstructionEventMockArgs = {
  buildingId: Building['id'];
  buildingFieldId: BuildingField['id'];
  level: number;
};

export const createBuildingConstructionEventMock = ({
  buildingId,
  buildingFieldId,
  level,
}: CreateBuildingConstructionEventMockArgs): GameEvent<'buildingLevelChange'> => {
  const { building, currentLevelResourceCost, nextLevelBuildingDuration } = getBuildingDataForLevel(buildingId, level);

  return {
    id: 'id',
    type: 'buildingLevelChange',
    villageId: villageMock.id,
    building,
    buildingFieldId,
    level,
    resourceCost: currentLevelResourceCost,
    startsAt: Date.now(),
    duration: nextLevelBuildingDuration,
  };
};
