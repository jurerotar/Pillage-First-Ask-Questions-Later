import { calculateBuildingDurationForLevel } from '@pillage-first/game-assets/buildings/utils';
import type { Building } from '@pillage-first/types/models/building';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import type {
  BuildingEvent,
  GameEvent,
  GameEventType,
} from '@pillage-first/types/models/game-event';
import { villageMock } from './village-mock';

type CreateBuildingConstructionEventMockArgs = {
  buildingId: Building['id'];
  buildingFieldId: BuildingField['id'];
  level: number;
};

export const createBuildingConstructionEventMock = ({
  buildingId,
  buildingFieldId,
  level,
}: CreateBuildingConstructionEventMockArgs): BuildingEvent => {
  const startsAt = Date.now();
  const duration = calculateBuildingDurationForLevel(buildingId, level);

  return {
    id: 1,
    type: 'buildingLevelChange',
    villageId: villageMock.id,
    buildingId,
    buildingFieldId,
    level,
    previousLevel: level - 1,
    startsAt: Date.now(),
    duration: duration,
    resolvesAt: startsAt + duration,
  };
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
