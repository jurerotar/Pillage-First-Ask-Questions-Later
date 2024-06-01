import { getBuildingData } from 'app/[game]/utils/building';
import { type GameEvent, GameEventType } from 'interfaces/models/events/game-event';
import { villageMock } from 'mocks/models/game/village/village-mock';

const cranny = getBuildingData('CRANNY');

export const buildingConstructionEventMock: GameEvent<GameEventType.BUILDING_CONSTRUCTION> = {
  id: 'id',
  type: GameEventType.BUILDING_CONSTRUCTION,
  resolvesAt: Date.now(),
  villageId: villageMock.id,
  building: cranny,
  buildingFieldId: 38,
  resourceCost: cranny.buildingCost[0],
};
