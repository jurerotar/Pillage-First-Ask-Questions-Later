import { QueryClient } from '@tanstack/react-query';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import type { Server } from 'app/interfaces/models/game/server';
import { egyptianServerMock, gaulServerMock, hunServerMock, romanServerMock, teutonServerMock } from 'app/tests/mocks/game/server-mock';
import { renderHookWithGameContext } from 'app/tests/test-utils';
import { describe, expect, test } from 'vitest';
import { serverCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';

describe('useTribe', () => {
  test('Server with gaul tribe will return gauls', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData<Server>([serverCacheKey], gaulServerMock);

    const { result } = renderHookWithGameContext(() => useTribe(), { queryClient });
    const { tribe } = result.current;
    expect(tribe).toBe('gauls');
  });

  test('Server with teuton tribe will return teutons', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData<Server>([serverCacheKey], teutonServerMock);

    const { result } = renderHookWithGameContext(() => useTribe(), { queryClient });
    const { tribe } = result.current;
    expect(tribe).toBe('teutons');
  });

  test('Server with roman tribe will return romans', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData<Server>([serverCacheKey], romanServerMock);

    const { result } = renderHookWithGameContext(() => useTribe(), { queryClient });
    const { tribe } = result.current;
    expect(tribe).toBe('romans');
  });

  test('Server with hun tribe will return huns', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData<Server>([serverCacheKey], hunServerMock);

    const { result } = renderHookWithGameContext(() => useTribe(), { queryClient });
    const { tribe } = result.current;
    expect(tribe).toBe('huns');
  });

  test('Server with egyptian tribe will return egyptian', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData<Server>([serverCacheKey], egyptianServerMock);

    const { result } = renderHookWithGameContext(() => useTribe(), { queryClient });
    const { tribe } = result.current;
    expect(tribe).toBe('egyptians');
  });
});
