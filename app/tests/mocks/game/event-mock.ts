import { calculateBuildingDurationForLevel } from 'app/assets/utils/buildings';
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
  const startsAt = Date.now();
  const duration = calculateBuildingDurationForLevel(buildingId, level);

  return {
    id: 'id',
    type: 'buildingLevelChange',
    villageId: villageMock.id,
    buildingId,
    buildingFieldId,
    level,
    previousLevel: level - 1,
    startsAt: Date.now(),
    duration: duration,
    resolvesAt: startsAt + duration,
  };
};
