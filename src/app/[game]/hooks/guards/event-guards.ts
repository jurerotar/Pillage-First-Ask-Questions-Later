import { type EventWithRequiredResourceCheck, type GameEvent, GameEventType } from 'interfaces/models/events/game-event';

export const isBuildingEvent = (event: GameEvent): event is GameEvent<GameEventType.BUILDING_CONSTRUCTION> => {
  return [GameEventType.BUILDING_CONSTRUCTION, GameEventType.BUILDING_SCHEDULED_CONSTRUCTION, GameEventType.BUILDING_LEVEL_CHANGE].includes(
    event.type,
  );
};

export const isScheduledBuildingEvent = (event: GameEvent): event is GameEvent<GameEventType.BUILDING_SCHEDULED_CONSTRUCTION> => {
  return GameEventType.BUILDING_SCHEDULED_CONSTRUCTION === event.type;
};

// Make sure to not include bulk events (barracks, stable, hospital training), because we check the price separately
const eventTypesThatRequireResourceCheck = [GameEventType.BUILDING_LEVEL_CHANGE, GameEventType.BUILDING_CONSTRUCTION];

export const doesEventRequireResourceCheck = <T extends GameEventType>(
  event: GameEvent<T>,
): event is GameEvent<T> & EventWithRequiredResourceCheck => {
  return eventTypesThatRequireResourceCheck.includes(event.type);
};

// Make sure to not include events like incoming raids, since that already updates the target village by itself
const eventTypesThatRequireResourceUpdate = [
  GameEventType.BUILDING_LEVEL_CHANGE,
  GameEventType.BUILDING_CONSTRUCTION,
  GameEventType.TROOP_TRAINING,
];

export const doesEventRequireResourceUpdate = (event: GameEvent): event is GameEvent => {
  return eventTypesThatRequireResourceUpdate.includes(event.type);
};
