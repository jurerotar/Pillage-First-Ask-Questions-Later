import { calculateBuildingDurationForLevel } from 'app/assets/utils/buildings';
import type { Building } from 'app/interfaces/models/game/building';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import type { BuildingField } from 'app/interfaces/models/game/village';
import { villageMock } from 'app/tests/mocks/game/village/village-mock';

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
  return {
    id: 'id',
    type: 'buildingLevelChange',
    villageId: villageMock.id,
    buildingId,
    buildingFieldId,
    level,
    previousLevel: level - 1,
    startsAt: Date.now(),
    duration: calculateBuildingDurationForLevel(buildingId, level),
  };
};
