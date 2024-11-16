import { QueryClient } from '@tanstack/react-query';
import { useTribe } from 'app/(game)/hooks/use-tribe';
import type { Server } from 'app/interfaces/models/game/server';
import { egyptianServerMock, gaulServerMock, hunServerMock, romanServerMock, teutonServerMock } from 'app/tests/mocks/game/server-mock';
import { renderHookWithGameContext } from 'app/tests/test-utils.js';
import { describe, expect, test } from 'vitest';
import { currentServerCacheKey } from 'app/query-keys';

describe('useTribe', () => {
  test('Server with gaul tribe will return gauls', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData<Server>([currentServerCacheKey], gaulServerMock);

    const { result } = renderHookWithGameContext(() => useTribe(), { queryClient });
    const { tribe } = result.current;
    expect(tribe).toBe('gauls');
  });

  test('Server with teuton tribe will return teutons', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData<Server>([currentServerCacheKey], teutonServerMock);

    const { result } = renderHookWithGameContext(() => useTribe(), { queryClient });
    const { tribe } = result.current;
    expect(tribe).toBe('teutons');
  });

  test('Server with roman tribe will return romans', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData<Server>([currentServerCacheKey], romanServerMock);

    const { result } = renderHookWithGameContext(() => useTribe(), { queryClient });
    const { tribe } = result.current;
    expect(tribe).toBe('romans');
  });

  test('Server with hun tribe will return huns', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData<Server>([currentServerCacheKey], hunServerMock);

    const { result } = renderHookWithGameContext(() => useTribe(), { queryClient });
    const { tribe } = result.current;
    expect(tribe).toBe('huns');
  });

  test('Server with egyptian tribe will return egyptian', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData<Server>([currentServerCacheKey], egyptianServerMock);

    const { result } = renderHookWithGameContext(() => useTribe(), { queryClient });
    const { tribe } = result.current;
    expect(tribe).toBe('egyptians');
  });
});
