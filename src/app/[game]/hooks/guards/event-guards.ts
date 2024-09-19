import { type GameEvent, GameEventType } from 'interfaces/models/events/game-event';

export const isBuildingEvent = (event: GameEvent): event is GameEvent<GameEventType.BUILDING_CONSTRUCTION> => {
  return [GameEventType.BUILDING_CONSTRUCTION, GameEventType.BUILDING_SCHEDULED_CONSTRUCTION, GameEventType.BUILDING_LEVEL_CHANGE].includes(
    event.type,
  );
};

export const isScheduledBuildingEvent = (event: GameEvent): event is GameEvent<GameEventType.BUILDING_SCHEDULED_CONSTRUCTION> => {
  return GameEventType.BUILDING_SCHEDULED_CONSTRUCTION === event.type;
};
