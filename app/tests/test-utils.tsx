import { dehydrate, type DehydratedState, hydrate, QueryClient } from '@tanstack/react-query';
import { render, renderHook } from '@testing-library/react';
import { CurrentResourceProvider } from 'app/(game)/providers/current-resources-provider.js';
import { generateEffects } from 'app/factories/effect-factory.js';
import type { Effect } from 'app/interfaces/models/game/effect.js';
import type { Player } from 'app/interfaces/models/game/player.js';
import type { Server } from 'app/interfaces/models/game/server.js';
import type { Village } from 'app/interfaces/models/game/village.js';
import { StateProvider } from 'app/providers/state-provider.js';
import { ViewportProvider } from 'app/providers/viewport-context.js';
import { playerMock } from 'app/tests/mocks/game/player-mock.js';
import { serverMock, serverPathMock } from 'app/tests/mocks/game/server-mock.js';
import { villageMock } from 'app/tests/mocks/game/village/village-mock.js';
import { composeComponents } from 'app/utils/jsx.js';
import type React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { currentServerCacheKey, effectsCacheKey, playersCacheKey, villagesCacheKey } from 'app/query-keys';

let dehydratedState: DehydratedState | null = null;

// To make the environment as fast as possible to set up, it's been gutted quite a lot. In case your tests are failing due to some missing data,
// make sure to add it yourself in custom query client!
const createGameEnvironment = (): QueryClient => {
  if (dehydratedState !== null) {
    const queryClient = new QueryClient();
    hydrate(queryClient, dehydratedState);

    return queryClient;
  }

  const queryClient = new QueryClient();
  const server = serverMock;

  const playerVillageMock = villageMock;

  queryClient.setQueryData<Server>([currentServerCacheKey], () => server);
  queryClient.setQueryData<Player[]>([playersCacheKey], () => [playerMock]);
  queryClient.setQueryData<Effect[]>([effectsCacheKey], () => generateEffects(server, playerVillageMock));
  queryClient.setQueryData<Village[]>([villagesCacheKey], () => [playerVillageMock]);

  dehydratedState = dehydrate(queryClient);

  return queryClient;
};

type RenderOptions = {
  path?: string;
  queryClient?: QueryClient;
  // Wrap your component with layout(s). If property is missing, default layout will be used.
  wrapper?: React.FCWithChildren[] | React.FCWithChildren;
  deviceSize?: {
    height: Window['innerHeight'];
    width: Window['innerWidth'];
  };
};

// Game components relly on url pathname params to determine correct data to display, so this testing environments mocks that.
// You're also provided a very limited subset set of game data in form of 'gameEnvironment', which you may override by providing your own query client.
const GameTestingEnvironment: React.FCWithChildren<RenderOptions> = (props) => {
  const { wrapper = [], deviceSize, children, queryClient: providedQueryClient, path } = props;

  const globalQueryClient = new QueryClient();
  const gameQueryClient = createGameEnvironment();

  // Overwrite data in game env client
  if (providedQueryClient) {
    const queries = providedQueryClient.getQueryCache().getAll();
    for (const { queryKey } of queries) {
      gameQueryClient.setQueryData(queryKey, providedQueryClient.getQueryData(queryKey));
    }
  }

  const element = composeComponents(
    <CurrentResourceProvider>{children}</CurrentResourceProvider>,
    Array.isArray(wrapper) ? wrapper : [wrapper],
  );

  return (
    <StateProvider queryClient={globalQueryClient}>
      <ViewportProvider initialSize={deviceSize}>
        <StateProvider queryClient={gameQueryClient}>
          <MemoryRouter
            initialEntries={[path ?? `${serverPathMock}/v-1`]}
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <Routes>
              <Route
                id="game"
                path="/game/:serverSlug/:villageSlug"
                element={element}
              >
                <Route
                  path="resources"
                  element={element}
                >
                  <Route
                    path=":buildingFieldId"
                    element={element}
                  />
                </Route>
                <Route
                  path="village"
                  element={element}
                >
                  <Route
                    path=":buildingFieldId"
                    element={element}
                  />
                </Route>
                <Route
                  path="reports"
                  element={element}
                >
                  <Route
                    path=":reportId"
                    element={element}
                  />
                </Route>
              </Route>
            </Routes>
          </MemoryRouter>
        </StateProvider>
      </ViewportProvider>
    </StateProvider>
  );
};

const TestingEnvironment: React.FCWithChildren<RenderOptions> = (props) => {
  const { wrapper = [], deviceSize, children, queryClient: providedQueryClient } = props;

  const queryClient = providedQueryClient ?? new QueryClient();

  return (
    <StateProvider queryClient={queryClient}>
      <ViewportProvider initialSize={deviceSize}>
        {composeComponents(children, Array.isArray(wrapper) ? wrapper : [wrapper])}
      </ViewportProvider>
    </StateProvider>
  );
};

const defaultOptions: RenderOptions = {
  wrapper: [],
  deviceSize: {
    height: 0,
    width: 0,
  },
};

export const renderHookWithContext = <TProps, TResult>(callback: (props: TProps) => TResult, options?: RenderOptions) => {
  return renderHook(callback, {
    wrapper: ({ children }) => <TestingEnvironment {...{ ...defaultOptions, ...options }}>{children}</TestingEnvironment>,
  });
};

export const renderWithContext = <T = HTMLElement>(
  ui: React.ReactElement<T, string | React.JSXElementConstructor<T>>,
  options?: RenderOptions,
) => {
  return render(ui, {
    wrapper: ({ children }) => <TestingEnvironment {...{ ...defaultOptions, ...options }}>{children}</TestingEnvironment>,
  });
};

export const renderWithGameContext = <T = HTMLElement>(
  ui: React.ReactElement<T, string | React.JSXElementConstructor<T>>,
  options?: RenderOptions,
) => {
  return render(ui, {
    wrapper: ({ children }) => <GameTestingEnvironment {...{ ...defaultOptions, ...options }}>{children}</GameTestingEnvironment>,
  });
};

export const renderHookWithGameContext = <TProps, TResult>(callback: (props: TProps) => TResult, options?: RenderOptions) => {
  return renderHook(callback, {
    wrapper: ({ children }) => <GameTestingEnvironment {...{ ...defaultOptions, ...options }}>{children}</GameTestingEnvironment>,
  });
};
