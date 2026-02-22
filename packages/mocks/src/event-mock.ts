import { calculateBuildingDurationForLevel } from '@pillage-first/game-assets/buildings/utils';
import type { Building } from '@pillage-first/types/models/building';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import type { BuildingEvent } from '@pillage-first/types/models/game-event';
import { villageMock } from './village-mock';

type CreateBuildingConstructionEventMockArgs = {
  buildingId: Building['id'];
  buildingFieldId: BuildingField['id'];
  level: number;
};

export const createBuildingConstructionEventMock = ({
  buildingId,
  buildingFieldId,
  level,
}: CreateBuildingConstructionEventMockArgs): BuildingEvent => {
  const startsAt = Date.now();
  const duration = calculateBuildingDurationForLevel(buildingId, level);

  return {
    id: 1,
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
