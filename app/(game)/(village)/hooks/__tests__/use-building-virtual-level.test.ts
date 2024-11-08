import { QueryClient } from '@tanstack/react-query';
import { useBuildingVirtualLevel } from 'app/(game)/(village)/hooks/use-building-virtual-level';
import type { GameEvent } from 'app/interfaces/models/events/game-event';
import { createBuildingConstructionEventMock } from 'app/tests/mocks/game/event-mock';
import { renderHookWithGameContext } from 'app/tests/test-utils.js';
import { describe, expect, test } from 'vitest';
import { eventsCacheKey } from 'app/query-keys';

const clayPitUpgradeLevel1EventMock = createBuildingConstructionEventMock({
  buildingId: 'CLAY_PIT',
  buildingFieldId: 5,
  level: 1,
});

const clayPitUpgradeLevel2EventMock = createBuildingConstructionEventMock({
  buildingId: 'CLAY_PIT',
  buildingFieldId: 5,
  level: 2,
});

describe('useBuildingVirtualLevel', () => {
  test("Virtual building level should be 0 when building level is 0 and it's not being upgraded", () => {
    const {
      result: { current },
    } = renderHookWithGameContext(() => useBuildingVirtualLevel('CLAY_PIT', 5));
    const { buildingLevel } = current;

    expect(buildingLevel).toBe(0);
  });

  test("Virtual building level should be 1 when it's building level is 0, but it's being upgraded to level 1", () => {
    const queryClient = new QueryClient();

    queryClient.setQueryData<GameEvent[]>([eventsCacheKey], [clayPitUpgradeLevel1EventMock]);

    const { result } = renderHookWithGameContext(() => useBuildingVirtualLevel('CLAY_PIT', 5), { queryClient });
    const { buildingLevel } = result.current;

    expect(buildingLevel).toBe(1);
  });

  test("Virtual building level should be 2 when it's building level is 0, but it's being upgraded to level 2", () => {
    const queryClient = new QueryClient();

    queryClient.setQueryData<GameEvent[]>([eventsCacheKey], [clayPitUpgradeLevel1EventMock, clayPitUpgradeLevel2EventMock]);

    const { result } = renderHookWithGameContext(() => useBuildingVirtualLevel('CLAY_PIT', 5), { queryClient });
    const { buildingLevel } = result.current;

    expect(buildingLevel).toBe(2);
  });

  test("Virtual building level should be 0 when it's building level is 0, regardless if another building is being upgraded", () => {
    const queryClient = new QueryClient();

    queryClient.setQueryData<GameEvent[]>([eventsCacheKey], [clayPitUpgradeLevel1EventMock, clayPitUpgradeLevel2EventMock]);

    const { result } = renderHookWithGameContext(() => useBuildingVirtualLevel('CLAY_PIT', 6), { queryClient });
    const { buildingLevel } = result.current;

    expect(buildingLevel).toBe(0);
  });
});
