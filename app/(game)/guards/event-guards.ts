import type { GameEvent, GameEventType, WithResourceCheckEvent, WithVillageIdEvent } from 'app/interfaces/models/game/game-event';

export const isVillageEvent = (event: GameEvent): event is WithVillageIdEvent => {
  return Object.hasOwn(event, 'villageId');
};

export const isBuildingEvent = (event: GameEvent): event is GameEvent<'buildingConstruction'> => {
  const buildingEventTypes: GameEventType[] = ['buildingScheduledConstruction', 'buildingLevelChange'];
  return buildingEventTypes.includes(event.type);
};

export const isTroopMovementEvent = (event: GameEvent): event is GameEvent<'troopMovement'> => {
  return event.type === 'troopMovement';
};

export const isFindNewVillageTroopMovementEvent = (event: GameEvent): event is GameEvent<'troopMovement'> => {
  return isTroopMovementEvent(event) && event.movementType === 'find-new-village';
};

export const isScheduledBuildingEvent = (event: GameEvent): event is GameEvent<'buildingScheduledConstruction'> => {
  return event.type === 'buildingScheduledConstruction';
};

export const isEventWithResourceCost = (event: GameEvent): event is WithResourceCheckEvent & WithVillageIdEvent => {
  return Object.hasOwn(event, 'resourceCost');
};
