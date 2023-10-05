import React, { Suspense } from 'react';
import { Await, Outlet, useRouteLoaderData } from 'react-router-dom';
import { GameLayoutSkeleton } from 'app/(game)/skeleton';

type RouteLoaderData = {
  resolved: boolean;
};

export const GameLayout = () => {
  const { resolved } = useRouteLoaderData('game-engine') as RouteLoaderData;

  return (
    <Suspense fallback={<GameLayoutSkeleton />}>
      <Await resolve={resolved}>
        <Outlet />
      </Await>
    </Suspense>
  );
};
