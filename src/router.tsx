import React, { lazy } from 'react';
import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';
import { AppLayout } from 'app/layout';
import { gameLoader } from 'app/_game/loader';

const PublicLayout = lazy(async () => ({ default: (await import('app/[public]/layout')).PublicLayout }));
const HomePage = lazy(async () => ({ default: (await import('app/[public]/_index/page')).HomePage }));
const VillagePage = lazy(async () => ({ default: (await import('app/_game/_village/page')).VillagePage }));
const ResourcesPage = lazy(async () => ({ default: (await import('app/_game/_resources/page')).ResourcesPage }));
const MapPage = lazy(async () => ({ default: (await import('app/_game/_map/page')).MapPage }));
const MapProvider = lazy(async () => ({ default: (await import('app/_game/_map/providers/map-context')).MapProvider }));
const GameLayout = lazy(async () => ({ default: (await import('app/_game/layout')).GameLayout }));
const GameProviders = lazy(async () => ({ default: (await import('app/_game/providers/game-providers')).GameProviders }));
const GameErrorBoundary = lazy(async () => ({ default: (await import('app/_game/error-boundary')).GameErrorBoundary }));

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<AppLayout />}>
      {/* Public paths */}
      <Route
        path="/"
        element={<PublicLayout />}
      >
        <Route
          index
          element={<HomePage />}
        />
      </Route>
      {/* Game paths */}
      <Route
        id="game"
        path="/game/:serverSlug/:villageSlug/"
        element={<GameProviders />}
        loader={gameLoader}
        errorElement={<GameErrorBoundary />}
      >
        <Route element={<GameLayout />}>
          <Route
            path="resources"
            element={<VillagePage />}
          />
          <Route
            path="villages"
            element={<ResourcesPage />}
          />
          <Route
            path="map"
            element={(<MapProvider><MapPage /></MapProvider>)}
          />
        </Route>
      </Route>
    </Route>
  )
);
