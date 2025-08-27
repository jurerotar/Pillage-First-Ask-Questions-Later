import { calculateBuildingDurationForLevel } from 'app/(game)/(village-slug)/utils/building';
import type { Building } from 'app/interfaces/models/game/building';
import type { BuildingField } from 'app/interfaces/models/game/building-field';
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
  return {
    id: 'id',
    type: 'buildingLevelChange',
    villageId: villageMock.id,
    buildingId,
    buildingFieldId,
    level,
    startsAt: Date.now(),
    duration: calculateBuildingDurationForLevel(buildingId, level),
    cachesToClearOnResolve: [],
  };
};
