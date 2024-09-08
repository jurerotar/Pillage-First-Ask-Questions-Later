import { QueryClient } from '@tanstack/react-query';
import { useBuildingVirtualLevel } from 'app/[game]/[village]/hooks/use-building-virtual-level';
import { eventsCacheKey } from 'app/[game]/hooks/use-events';
import type { GameEvent } from 'interfaces/models/events/game-event';
import { clayPitUpgradeLevel1EventMock, clayPitUpgradeLevel2EventMock } from 'mocks/game/event-mock';
import { renderHookWithGameContext } from 'test-utils';
import { describe, expect } from 'vitest';

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