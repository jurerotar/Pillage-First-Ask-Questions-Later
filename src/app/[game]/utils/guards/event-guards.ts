import { type EventWithRequiredResourceCheck, type GameEvent, GameEventType } from 'interfaces/models/events/game-event';

const eventTypesThatRequireResourceCheck = [GameEventType.BUILDING_LEVEL_CHANGE, GameEventType.BUILDING_CONSTRUCTION];

export const doesEventRequireResourceCheck = <T extends GameEventType>(
  event: GameEvent<T>
): event is GameEvent<T> & EventWithRequiredResourceCheck => {
  return eventTypesThatRequireResourceCheck.includes(event.type);
};
