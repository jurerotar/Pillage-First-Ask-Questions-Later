import { type DehydratedState, hydrate, useQueryClient } from '@tanstack/react-query';
import { GameEngineProvider } from 'app/[game]/providers/game-engine-provider';
import React from 'react';
import { Outlet, useRouteLoaderData } from 'react-router-dom';

type RouteLoaderData = {
  dehydratedState: DehydratedState;
};

export const GameProviders = () => {
  const queryClient = useQueryClient();
  const { dehydratedState } = useRouteLoaderData('game') as RouteLoaderData;

  hydrate(queryClient, dehydratedState);

  return (
    <GameEngineProvider>
      <Outlet />
    </GameEngineProvider>
  );
};
