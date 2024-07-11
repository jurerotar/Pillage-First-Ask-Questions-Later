import { QueryClient } from '@tanstack/react-query';
import { render, renderHook } from '@testing-library/react';
import { mapFiltersCacheKey } from 'app/[game]/[map]/hooks/use-map-filters';
import { mapMarkersCacheKey } from 'app/[game]/[map]/hooks/use-map-markers';
import { achievementsCacheKey } from 'app/[game]/hooks/use-achievements';
import { currentServerCacheKey } from 'app/[game]/hooks/use-current-server';
import { effectsCacheKey } from 'app/[game]/hooks/use-effects';
import { eventsCacheKey } from 'app/[game]/hooks/use-events';
import { heroCacheKey } from 'app/[game]/hooks/use-hero';
import { mapCacheKey } from 'app/[game]/hooks/use-map';
import { playersCacheKey } from 'app/[game]/hooks/use-players';
import { questsCacheKey } from 'app/[game]/hooks/use-quests';
import { reportsCacheKey } from 'app/[game]/hooks/use-reports';
import { reputationsCacheKey } from 'app/[game]/hooks/use-reputations';
import { troopsCacheKey } from 'app/[game]/hooks/use-troops';
import { villagesCacheKey } from 'app/[game]/hooks/use-villages';
import { isOccupiedOccupiableTile, isUnoccupiedOasisTile } from 'app/[game]/utils/guards/map-guards';
import { generateEffects } from 'app/factories/effect-factory';
import { heroFactory } from 'app/factories/hero-factory';
import { mapFactory } from 'app/factories/map-factory';
import { mapFiltersFactory } from 'app/factories/map-filters-factory';
import { generatePlayers } from 'app/factories/player-factory';
import { generateQuests } from 'app/factories/quest-factory';
import { generateReputations } from 'app/factories/reputation-factory';
import { generateTroops } from 'app/factories/troop-factory';
import { generateVillages } from 'app/factories/village-factory';
import { StateProvider } from 'app/providers/state-provider';
import { ViewportProvider } from 'app/providers/viewport-context';
import { composeComponents } from 'app/utils/jsx';
import type { GameEvent } from 'interfaces/models/events/game-event';
import type { Achievement } from 'interfaces/models/game/achievement';
import type { Effect } from 'interfaces/models/game/effect';
import type { Hero } from 'interfaces/models/game/hero';
import type { MapFilters } from 'interfaces/models/game/map-filters';
import type { MapMarker } from 'interfaces/models/game/map-marker';
import type { Player } from 'interfaces/models/game/player';
import type { Quest } from 'interfaces/models/game/quest';
import type { Report } from 'interfaces/models/game/report';
import type { Reputation } from 'interfaces/models/game/reputation';
import type { Server } from 'interfaces/models/game/server';
import type { Tile } from 'interfaces/models/game/tile';
import type { Troop } from 'interfaces/models/game/troop';
import type { Village } from 'interfaces/models/game/village';
import { serverMock } from 'mocks/game/server-mock';
import type React from 'react';
import type { FCWithChildren } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const createGameEnvironment = (): QueryClient => {
  const queryClient = new QueryClient();
  const server = serverMock;

  const reputations = generateReputations();
  const npcFactions = reputations.filter(({ faction }) => faction !== 'player').map(({ faction }) => faction);

  const players = generatePlayers(server, npcFactions, 50);

  const tiles = mapFactory({ server, players });

  const occupiableOasisTiles = tiles.filter(isUnoccupiedOasisTile);
  const occupiedOccupiableTiles = tiles.filter(isOccupiedOccupiableTile);

  const villages = generateVillages({ server, occupiedOccupiableTiles, players });
  const playerStartingVillage = villages[0];

  queryClient.setQueryData<Server>([currentServerCacheKey], () => server);
  queryClient.setQueryData<Player[]>([playersCacheKey], () => players);
  queryClient.setQueryData<Reputation[]>([reputationsCacheKey], () => reputations);
  queryClient.setQueryData<Achievement[]>([achievementsCacheKey], () => []);
  queryClient.setQueryData<Effect[]>([effectsCacheKey], () => generateEffects(server, playerStartingVillage));
  queryClient.setQueryData<GameEvent[]>([eventsCacheKey], () => []);
  queryClient.setQueryData<Hero>([heroCacheKey], () => heroFactory(server));
  queryClient.setQueryData<Tile[]>([mapCacheKey], () => tiles);
  queryClient.setQueryData<Quest[]>([questsCacheKey], () => generateQuests(playerStartingVillage.id));
  queryClient.setQueryData<Report[]>([reportsCacheKey], () => []);
  queryClient.setQueryData<Village[]>([villagesCacheKey], () => villages);
  queryClient.setQueryData<MapFilters>([mapFiltersCacheKey], () => mapFiltersFactory());
  queryClient.setQueryData<MapMarker[]>([mapMarkersCacheKey], () => []);
  queryClient.setQueryData<Troop[]>([troopsCacheKey], () =>
    generateTroops({ server, occupiedOccupiableTiles, occupiableOasisTiles, players }),
  );

  return queryClient;
};

type RenderOptions = {
  path?: string;
  queryClient?: QueryClient;
  // Wrap your component with layout(s). If property is missing, default layout will be used.
  wrapper?: FCWithChildren[] | FCWithChildren;
  deviceSize?: {
    height: Window['innerHeight'];
    width: Window['innerWidth'];
  };
};

// Game components relly on url pathname params to determine correct data to display, so this testing environments mocks that. You're also provided
// a default set of game data in form of 'gameEnvironment', which you may override by providing your own query client.
const GameTestingEnvironment: FCWithChildren<RenderOptions> = (props) => {
  const { wrapper = [], deviceSize, children, queryClient: providedQueryClient, path } = props;

  const queryClient = createGameEnvironment();

  // Overwrite data in game env client
  if (providedQueryClient) {
    const queries = providedQueryClient.getQueryCache().getAll();
    for (const { queryKey } of queries) {
      queryClient.setQueryData(queryKey, providedQueryClient.getQueryData(queryKey));
    }
  }

  return (
    <StateProvider queryClient={queryClient}>
      <ViewportProvider initialSize={deviceSize}>
        <MemoryRouter initialEntries={[path ?? `/game/${serverMock.slug}/v-1/`]}>
          <Routes>
            <Route
              id="game"
              path="/game/:serverSlug/:villageSlug/*"
              element={composeComponents(children, Array.isArray(wrapper) ? wrapper : [wrapper])}
            />
          </Routes>
        </MemoryRouter>
      </ViewportProvider>
    </StateProvider>
  );
};

const TestingEnvironment: FCWithChildren<RenderOptions> = (props) => {
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
