import React from 'react';
import { DehydratedState, hydrate, useQueryClient } from '@tanstack/react-query';
import { Outlet, useRouteLoaderData } from 'react-router-dom';
import { GameEngineProvider } from 'app/_game/providers/game-engine-provider';

type RouteLoaderData = {
  dehydratedState: DehydratedState;
};

export const GameProviders = () => {
  const queryClient = useQueryClient();
  const { dehydratedState } = useRouteLoaderData('game-engine') as RouteLoaderData;

  hydrate(queryClient, dehydratedState);

  return (
    <GameEngineProvider>
      <Outlet />
    </GameEngineProvider>
  );
};
