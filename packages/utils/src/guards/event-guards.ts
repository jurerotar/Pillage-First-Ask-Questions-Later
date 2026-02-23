import type {
  GameEvent,
  GameEventType,
  TroopMovementEvent,
} from '@pillage-first/types/models/game-event';

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
): event is GameEvent<
  'buildingScheduledConstruction' | 'buildingLevelChange'
> => {
  const buildingEventTypes: GameEventType[] = [
    'buildingScheduledConstruction',
    'buildingLevelChange',
  ];
  return buildingEventTypes.includes(event.type);
};

const troopMovementEventTypes = new Set<GameEventType>([
  'troopMovementReinforcements',
  'troopMovementRelocation',
  'troopMovementReturn',
  'troopMovementFindNewVillage',
  'troopMovementAttack',
  'troopMovementRaid',
  'troopMovementOasisOccupation',
  'troopMovementAdventure',
]);

export const isTroopMovementEvent = (
  event: GameEvent,
): event is TroopMovementEvent => {
  return troopMovementEventTypes.has(event.type);
};

export const isReinforcementsTroopMovementEvent = (
  event: GameEvent,
): event is GameEvent<'troopMovementReinforcements'> => {
  return event.type === 'troopMovementReinforcements';
};

export const isRelocationTroopMovementEvent = (
  event: GameEvent,
): event is GameEvent<'troopMovementRelocation'> => {
  return event.type === 'troopMovementRelocation';
};

export const isReturnTroopMovementEvent = (
  event: GameEvent,
): event is GameEvent<'troopMovementReturn'> => {
  return event.type === 'troopMovementReturn';
};

export const isFindNewVillageTroopMovementEvent = (
  event: GameEvent,
): event is GameEvent<'troopMovementFindNewVillage'> => {
  return event.type === 'troopMovementFindNewVillage';
};

export const isAttackTroopMovementEvent = (
  event: GameEvent,
): event is GameEvent<'troopMovementAttack'> => {
  return event.type === 'troopMovementAttack';
};

export const isRaidTroopMovementEvent = (
  event: GameEvent,
): event is GameEvent<'troopMovementRaid'> => {
  return event.type === 'troopMovementRaid';
};

export const isOasisOccupationTroopMovementEvent = (
  event: GameEvent,
): event is GameEvent<'troopMovementOasisOccupation'> => {
  return event.type === 'troopMovementOasisOccupation';
};

export const isAdventureTroopMovementEvent = (
  event: GameEvent,
): event is GameEvent<'troopMovementAdventure'> => {
  return event.type === 'troopMovementAdventure';
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
