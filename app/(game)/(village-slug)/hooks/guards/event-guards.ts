import type { GameEvent, GameEventType, WithResourceCheckEvent, WithVillageIdEvent } from 'app/interfaces/models/game/game-event';

export const isBuildingEvent = (event: GameEvent): event is GameEvent<'buildingConstruction'> => {
  const buildingEventTypes: GameEventType[] = ['buildingScheduledConstruction', 'buildingLevelChange'];
  return buildingEventTypes.includes(event.type);
};

export const isScheduledBuildingEvent = (event: GameEvent): event is GameEvent<'buildingScheduledConstruction'> => {
  return event.type === 'buildingScheduledConstruction';
};

// Make sure to not include bulk events (barracks, stable, hospital training), because we check the price separately
const eventTypesThatRequireResourceCheck: GameEventType[] = ['buildingLevelChange', 'buildingConstruction'];

export const doesEventRequireResourceCheck = (event: GameEvent): event is GameEvent & WithResourceCheckEvent & WithVillageIdEvent => {
  return eventTypesThatRequireResourceCheck.includes(event.type);
};

// Make sure to not include events like incoming raids, since that already updates the target village by itself
const eventTypesThatRequireResourceUpdate: GameEventType[] = [
  'buildingLevelChange',
  'buildingConstruction',
  'buildingDestruction',
  'troopTraining',
];

export const doesEventRequireResourceUpdate = (
  _event: Partial<GameEvent>,
  type: GameEventType,
): _event is GameEvent & WithVillageIdEvent & WithResourceCheckEvent => {
  return eventTypesThatRequireResourceUpdate.includes(type);
};
