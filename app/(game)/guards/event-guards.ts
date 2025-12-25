import { getEventCost } from 'app/(game)/api/handlers/utils/events';
import type {
  GameEvent,
  GameEventType,
  WithVillageIdEvent,
} from 'app/interfaces/models/game/game-event';

export const isVillageEvent = (
  event: GameEvent,
): event is WithVillageIdEvent => {
  return Object.hasOwn(event, 'villageId');
};

export const isBuildingConstructionEvent = (
  event: GameEvent,
): event is GameEvent<'buildingConstruction'> => {
  return event.type === 'buildingConstruction';
};

export const isBuildingDestructionEvent = (
  event: GameEvent,
): event is GameEvent<'buildingDestruction'> => {
  return event.type === 'buildingDestruction';
};

export const isBuildingLevelUpEvent = (
  event: GameEvent,
): event is GameEvent<'buildingLevelChange'> => {
  return event.type === 'buildingLevelChange';
};

export const isBuildingEvent = (
  event: GameEvent,
): event is GameEvent<'buildingConstruction'> => {
  const buildingEventTypes: GameEventType[] = [
    'buildingScheduledConstruction',
    'buildingLevelChange',
  ];
  return buildingEventTypes.includes(event.type);
};

export const isTroopMovementEvent = (
  event: GameEvent,
): event is GameEvent<'troopMovement'> => {
  return event.type === 'troopMovement';
};

export const isFindNewVillageTroopMovementEvent = (
  event: GameEvent,
): event is GameEvent<'troopMovement'> => {
  return (
    isTroopMovementEvent(event) && event.movementType === 'find-new-village'
  );
};

export const isScheduledBuildingEvent = (
  event: GameEvent,
): event is GameEvent<'buildingScheduledConstruction'> => {
  return event.type === 'buildingScheduledConstruction';
};

export const isUnitImprovementEvent = (
  event: GameEvent,
): event is GameEvent<'unitImprovement'> => {
  return event.type === 'unitImprovement';
};

export const isUnitResearchEvent = (
  event: GameEvent,
): event is GameEvent<'unitResearch'> => {
  return event.type === 'unitResearch';
};

export const isTroopTrainingEvent = (
  event: GameEvent,
): event is GameEvent<'troopTraining'> => {
  return event.type === 'troopTraining';
};

export const isAdventurePointIncreaseEvent = (
  event: GameEvent,
): event is GameEvent<'adventurePointIncrease'> => {
  return event.type === 'adventurePointIncrease';
};

export const isEventWithResourceCost = (
  event: GameEvent,
): event is WithVillageIdEvent => {
  const eventCost = getEventCost(event);

  return eventCost.some((cost) => cost > 0);
};
