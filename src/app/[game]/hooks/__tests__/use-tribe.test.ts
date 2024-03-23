import { describe } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { currentServerCacheKey } from 'app/[game]/hooks/use-current-server';
import { Server } from 'interfaces/models/game/server';
import {
  egyptianServerMock,
  gaulServerMock,
  hunServerMock,
  romanServerMock,
  serverMock,
  teutonServerMock,
} from 'mocks/models/game/server-mock';
import { renderHookWithGameContext } from 'test-utils';
import { useTribe } from 'app/[game]/hooks/use-tribe';

const { slug } = serverMock;

describe('useTribe', () => {
  test('Server with gaul tribe will return gauls', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData<Server>([currentServerCacheKey, slug], gaulServerMock);

    const { result } = renderHookWithGameContext(() => useTribe(), { queryClient });
    const { tribe } = result.current;
    expect(tribe).toBe('gauls');
  });

  test('Server with teuton tribe will return teutons', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData<Server>([currentServerCacheKey, slug], teutonServerMock);

    const { result } = renderHookWithGameContext(() => useTribe(), { queryClient });
    const { tribe } = result.current;
    expect(tribe).toBe('teutons');
  });

  test('Server with roman tribe will return romans', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData<Server>([currentServerCacheKey, slug], romanServerMock);

    const { result } = renderHookWithGameContext(() => useTribe(), { queryClient });
    const { tribe } = result.current;
    expect(tribe).toBe('romans');
  });

  test('Server with hun tribe will return huns', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData<Server>([currentServerCacheKey, slug], hunServerMock);

    const { result } = renderHookWithGameContext(() => useTribe(), { queryClient });
    const { tribe } = result.current;
    expect(tribe).toBe('huns');
  });

  test('Server with egyptian tribe will return egyptian', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData<Server>([currentServerCacheKey, slug], egyptianServerMock);

    const { result } = renderHookWithGameContext(() => useTribe(), { queryClient });
    const { tribe } = result.current;
    expect(tribe).toBe('egyptians');
  });
});
