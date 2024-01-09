import React, { lazy } from 'react';
import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';
import { gameLoader } from 'app/[game]/loader';
import { AppLayout } from 'app/layout';

const PublicLayout = lazy(async () => ({ default: (await import('app/[public]/layout')).PublicLayout }));
const HomePage = lazy(async () => ({ default: (await import('app/[public]/[index]/page')).HomePage }));
const VillagePage = lazy(async () => ({ default: (await import('app/[game]/[village]/page')).VillagePage }));
const ResourcesPage = lazy(async () => ({ default: (await import('app/[game]/[resources]/page')).ResourcesPage }));
const MapPage = lazy(async () => ({ default: (await import('app/[game]/[map]/page')).MapPage }));
const MapProvider = lazy(async () => ({ default: (await import('app/[game]/[map]/providers/map-context')).MapProvider }));
const GameLayout = lazy(async () => ({ default: (await import('app/[game]/layout')).GameLayout }));
const GameProviders = lazy(async () => ({ default: (await import('app/[game]/providers/game-providers')).GameProviders }));
const GameErrorBoundary = lazy(async () => ({ default: (await import('app/[game]/error-boundary')).GameErrorBoundary }));

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
            element={<ResourcesPage />}
          />
          <Route
            path="village"
            element={<VillagePage />}
          />
          <Route
            path="map"
            element={
              <MapProvider>
                <MapPage />
              </MapProvider>
            }
          />
        </Route>
      </Route>
    </Route>
  )
);
