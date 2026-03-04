import type {
  GameEvent,
  GameEventType,
} from '@pillage-first/types/models/game-event';
import { villageMock } from './village-mock';

export const createBuildingConstructionEventMock = (
  overrides: Partial<GameEvent<'buildingConstruction'>> = {},
): GameEvent<'buildingConstruction'> => {
  return createGameEventMock('buildingConstruction', {
    buildingId: 'MAIN_BUILDING',
    buildingFieldId: 19,
    level: 1,
    previousLevel: 0,
    ...overrides,
  });
};

export const createBuildingDestructionEventMock = (
  overrides: Partial<GameEvent<'buildingDestruction'>> = {},
): GameEvent<'buildingDestruction'> => {
  return createGameEventMock('buildingDestruction', {
    buildingId: 'MAIN_BUILDING',
    buildingFieldId: 19,
    previousLevel: 1,
    ...overrides,
  });
};

export const createTroopMovementAdventureEventMock = (
  overrides: Partial<GameEvent<'troopMovementAdventure'>> = {},
): GameEvent<'troopMovementAdventure'> => {
  return createGameEventMock('troopMovementAdventure', {
    targetId: 2,
    troops: [{ unitId: 'HERO', amount: 1, tileId: 1, source: 1 }],
    ...overrides,
  });
};

export const createTroopMovementRelocationEventMock = (
  overrides: Partial<GameEvent<'troopMovementRelocation'>> = {},
): GameEvent<'troopMovementRelocation'> => {
  return createGameEventMock('troopMovementRelocation', {
    targetId: 2,
    troops: [{ unitId: 'HERO', amount: 1, tileId: 1, source: 1 }],
    ...overrides,
  });
};

export const createTroopMovementFindNewVillageEventMock = (
  overrides: Partial<GameEvent<'troopMovementFindNewVillage'>> = {},
): GameEvent<'troopMovementFindNewVillage'> => {
  return createGameEventMock('troopMovementFindNewVillage', {
    targetId: 2,
    troops: [],
    ...overrides,
  });
};

export const createTroopMovementAttackEventMock = (
  overrides: Partial<GameEvent<'troopMovementAttack'>> = {},
): GameEvent<'troopMovementAttack'> => {
  return createGameEventMock('troopMovementAttack', {
    targetId: 2,
    troops: [{ unitId: 'LEGIONNAIRE', amount: 10, tileId: 1, source: 1 }],
    ...overrides,
  });
};

export const createTroopMovementRaidEventMock = (
  overrides: Partial<GameEvent<'troopMovementRaid'>> = {},
): GameEvent<'troopMovementRaid'> => {
  return createGameEventMock('troopMovementRaid', {
    targetId: 2,
    troops: [{ unitId: 'LEGIONNAIRE', amount: 10, tileId: 1, source: 1 }],
    ...overrides,
  });
};

export const createAdventurePointIncreaseEventMock = (
  overrides: Partial<GameEvent<'adventurePointIncrease'>> = {},
): GameEvent<'adventurePointIncrease'> => {
  return createGameEventMock('adventurePointIncrease', {
    ...overrides,
  });
};

export const createHeroRevivalEventMock = (
  overrides: Partial<GameEvent<'heroRevival'>> = {},
): GameEvent<'heroRevival'> => {
  return createGameEventMock('heroRevival', {
    ...overrides,
  });
};

export const createHeroHealthRegenerationEventMock = (
  overrides: Partial<GameEvent<'heroHealthRegeneration'>> = {},
): GameEvent<'heroHealthRegeneration'> => {
  return createGameEventMock('heroHealthRegeneration', {
    ...overrides,
  });
};

export const createGameEventMock = <T extends GameEventType>(
  type: T,
  overrides: Partial<GameEvent<T>> = {},
): GameEvent<T> => {
  const startsAt = overrides.startsAt ?? Date.now();
  const duration = overrides.duration ?? 0;

  const base: GameEvent = {
    id: Math.floor(Math.random() * 100_000),
    type,
    startsAt,
    duration,
    resolvesAt: startsAt + duration,
    villageId: villageMock.id,
  };

  return {
    ...base,
    ...overrides,
  } as GameEvent<T>;
};

export const createUnitImprovementEventMock = (
  overrides: Partial<GameEvent<'unitImprovement'>> = {},
): GameEvent<'unitImprovement'> => {
  return createGameEventMock('unitImprovement', {
    unitId: 'LEGIONNAIRE',
    level: 1,
    ...overrides,
  });
};

export const createUnitResearchEventMock = (
  overrides: Partial<GameEvent<'unitResearch'>> = {},
): GameEvent<'unitResearch'> => {
  return createGameEventMock('unitResearch', {
    unitId: 'LEGIONNAIRE',
    ...overrides,
  });
};

export const createTroopTrainingEventMock = (
  overrides: Partial<GameEvent<'troopTraining'>> = {},
): GameEvent<'troopTraining'> => {
  return createGameEventMock('troopTraining', {
    unitId: 'LEGIONNAIRE',
    amount: 1,
    buildingId: 'BARRACKS',
    batchId: globalThis.crypto.randomUUID(),
    durationEffectId: 'barracksTrainingDuration',
    ...overrides,
  });
};

export const createBuildingLevelChangeEventMock = (
  overrides: Partial<GameEvent<'buildingLevelChange'>> = {},
): GameEvent<'buildingLevelChange'> => {
  return createGameEventMock('buildingLevelChange', {
    buildingId: 'MAIN_BUILDING',
    buildingFieldId: 19,
    level: 1,
    previousLevel: 0,
    ...overrides,
  });
};
