import { QueryClient } from '@tanstack/react-query';
import { useBuildingActions } from 'app/(game)/(village-slug)/(village)/hooks/use-building-actions';
import { calculateBuildingDurationForLevel } from 'app/(game)/(village-slug)/utils/building';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import type { Server } from 'app/interfaces/models/game/server';
import { createBuildingConstructionEventMock } from 'app/tests/mocks/game/event-mock';
import { romanServerMock, serverPathMock } from 'app/tests/mocks/game/server-mock';
import { renderHookWithGameContext } from 'app/tests/test-utils';
import { afterAll, beforeAll, describe, expect, type Mock, test, vi } from 'vitest';
import { eventsCacheKey, serverCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';

let clayPitUpgradeLevel1EventMock: GameEvent;
let clayPitUpgradeLevel2EventMock: GameEvent;
let mainBuildingUpgradeLevel1EventMock: GameEvent;
let mainBuildingUpgradeLevel2EventMock: GameEvent;

beforeAll(() => {
  vi.spyOn(Date, 'now').mockReturnValue(0);
  clayPitUpgradeLevel1EventMock = createBuildingConstructionEventMock({
    buildingId: 'CLAY_PIT',
    buildingFieldId: 5,
    level: 1,
  });
  clayPitUpgradeLevel2EventMock = createBuildingConstructionEventMock({
    buildingId: 'CLAY_PIT',
    buildingFieldId: 5,
    level: 2,
  });
  mainBuildingUpgradeLevel1EventMock = createBuildingConstructionEventMock({
    buildingId: 'MAIN_BUILDING',
    buildingFieldId: 38,
    level: 1,
  });
  mainBuildingUpgradeLevel2EventMock = createBuildingConstructionEventMock({
    buildingId: 'MAIN_BUILDING',
    buildingFieldId: 38,
    level: 2,
  });
});

afterAll(() => {
  (Date.now as Mock).mockRestore();
});

describe('calculateTimings', () => {
  test('With no building events happening, new building event should resolve in time it takes to construct said building', () => {
    const { result } = renderHookWithGameContext(() => useBuildingActions('CLAY_PIT', 5));
    const { calculateTimings } = result.current;
    const { startsAt, duration } = calculateTimings();

    expect(startsAt + duration).toBe(calculateBuildingDurationForLevel('CLAY_PIT', 1));
  });

  test('With a building event happening, new building event should resolve in time it takes to construct said building + the building before', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData<GameEvent[]>([eventsCacheKey], [clayPitUpgradeLevel1EventMock]);

    const { result } = renderHookWithGameContext(() => useBuildingActions('CLAY_PIT', 5), { queryClient, path: `${serverPathMock}/v-1/` });
    const { calculateTimings } = result.current;
    const { startsAt, duration } = calculateTimings();

    expect(startsAt + duration).toBe(calculateBuildingDurationForLevel('CLAY_PIT', 1) + calculateBuildingDurationForLevel('CLAY_PIT', 2));
  });

  test('With multiple building events happening, new building event should resolve in time it takes to construct said building + all of the events before it', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData<GameEvent[]>([eventsCacheKey], [clayPitUpgradeLevel1EventMock, clayPitUpgradeLevel2EventMock]);

    const { result } = renderHookWithGameContext(() => useBuildingActions('CLAY_PIT', 5), { queryClient });
    const { calculateTimings } = result.current;
    const { startsAt, duration } = calculateTimings();

    // Normally this would be the sum of all 3 events, but we attach the next event to the end of the previous one, so we only need to look
    // at last one in this case
    expect(startsAt + duration).toBe(calculateBuildingDurationForLevel('CLAY_PIT', 2) + calculateBuildingDurationForLevel('CLAY_PIT', 3));
  });

  test('As roman, a village building should not delay a resource building', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData<Server>([serverCacheKey], romanServerMock);
    queryClient.setQueryData<GameEvent[]>([eventsCacheKey], [mainBuildingUpgradeLevel1EventMock]);

    const { result } = renderHookWithGameContext(() => useBuildingActions('CLAY_PIT', 5), { queryClient });
    const { calculateTimings } = result.current;
    const { startsAt, duration } = calculateTimings();

    expect(startsAt + duration).toBe(calculateBuildingDurationForLevel('CLAY_PIT', 1));
  });

  test('As roman, a resource building should not delay a village building', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData<Server>([serverCacheKey], romanServerMock);
    queryClient.setQueryData<GameEvent[]>([eventsCacheKey], [clayPitUpgradeLevel1EventMock]);

    const { result } = renderHookWithGameContext(() => useBuildingActions('MAIN_BUILDING', 38), { queryClient });
    const { calculateTimings } = result.current;
    const { startsAt, duration } = calculateTimings();

    expect(startsAt + duration).toBe(calculateBuildingDurationForLevel('MAIN_BUILDING', 2));
  });

  test('As roman, second resource building event should only be delayed by previous resource building events', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData<Server>([serverCacheKey], romanServerMock);
    queryClient.setQueryData<GameEvent[]>([eventsCacheKey], [mainBuildingUpgradeLevel1EventMock, clayPitUpgradeLevel1EventMock]);

    const { result } = renderHookWithGameContext(() => useBuildingActions('CLAY_PIT', 5), { queryClient });
    const { calculateTimings } = result.current;
    const { startsAt, duration } = calculateTimings();

    expect(startsAt + duration).toBe(calculateBuildingDurationForLevel('CLAY_PIT', 1) + calculateBuildingDurationForLevel('CLAY_PIT', 2));
  });

  test('As roman, second village building event should only be delayed by previous village building events', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData<Server>([serverCacheKey], romanServerMock);
    queryClient.setQueryData<GameEvent[]>([eventsCacheKey], [mainBuildingUpgradeLevel2EventMock, clayPitUpgradeLevel1EventMock]);

    const { result } = renderHookWithGameContext(() => useBuildingActions('MAIN_BUILDING', 38), { queryClient });
    const { calculateTimings } = result.current;
    const { startsAt } = calculateTimings();

    expect(startsAt).toBe(calculateBuildingDurationForLevel('MAIN_BUILDING', 2));
  });
});
