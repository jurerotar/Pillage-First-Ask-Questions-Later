import { GameEvent, GameEventType } from 'interfaces/models/events/game-event';
import { villageMock } from 'mocks/models/game/village/village-mock';
import { serverMock } from 'mocks/models/game/server-mock';

export const buildingConstructionEventMock: GameEvent<GameEventType.BUILDING_CONSTRUCTION> = {
  id: 'id',
  type: GameEventType.BUILDING_CONSTRUCTION,
  resolvesAt: Date.now(),
  villageId: villageMock.id,
  serverId: serverMock.id,
  buildingId: 'CRANNY',
  buildingFieldId: 38
}
