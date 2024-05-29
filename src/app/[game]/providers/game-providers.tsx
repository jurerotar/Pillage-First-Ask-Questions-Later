import { type DehydratedState, hydrate, useQueryClient } from '@tanstack/react-query';
import { GameEngineProvider } from 'app/[game]/providers/game-engine-provider';
import { Outlet, useRouteLoaderData } from 'react-router-dom';
import { CurrentResourceProvider } from 'app/[game]/providers/current-resources-provider';

type RouteLoaderData = {
  dehydratedState: DehydratedState;
};

export const GameProviders = () => {
  const queryClient = useQueryClient();
  const { dehydratedState } = useRouteLoaderData('game') as RouteLoaderData;

  hydrate(queryClient, dehydratedState);

  return (
    <GameEngineProvider>
      <CurrentResourceProvider>
        <Outlet />
      </CurrentResourceProvider>
    </GameEngineProvider>
  );
};
