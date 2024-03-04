import React, { Suspense, useEffect } from 'react';
import { Await, Outlet, useRouteLoaderData } from 'react-router-dom';
import { GameLayoutSkeleton } from 'app/[game]/skeleton';
import { useAvailableServers } from 'app/hooks/use-available-servers';
import { useCurrentServer } from 'app/[game]/hooks/use-current-server';

type RouteLoaderData = {
  resolved: boolean;
};

export const GameLayout = () => {
  const { updateLastLoggedIn } = useAvailableServers();
  const { resolved } = useRouteLoaderData('game') as RouteLoaderData;
  const { server } = useCurrentServer();

  useEffect(() => {
    if (!resolved) {
      return;
    }

    updateLastLoggedIn({ server });

    const intervalId = window.setInterval(() => {
      updateLastLoggedIn({ server });
    }, 60000);

    return () => window.clearInterval(intervalId);
  }, [resolved, server, updateLastLoggedIn]);

  return (
    <Suspense fallback={<GameLayoutSkeleton />}>
      <Await resolve={resolved}>
        <Outlet />
      </Await>
    </Suspense>
  );
};
