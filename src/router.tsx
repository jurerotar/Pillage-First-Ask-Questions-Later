import React, { lazy } from 'react';
import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';
import { AppLayout } from 'app/layout';
import { gameLoader } from 'app/_game/loader';
import { GameErrorBoundary } from 'app/_game/error-boundary';

const PublicLayout = lazy(async () => ({ default: (await import('app/__public/layout')).PublicLayout }));
const HomePage = lazy(async () => ({ default: (await import('app/__public/home/page')).HomePage }));
const VillagePage = lazy(async () => ({ default: (await import('app/_game/village/page')).VillagePage }));
const ResourcesPage = lazy(async () => ({ default: (await import('app/_game/resources/page')).ResourcesPage }));
const MapPage = lazy(async () => ({ default: (await import('app/_game/map/page')).MapPage }));
const MapProvider = lazy(async () => ({ default: (await import('app/_game/map/providers/map-context')).MapProvider }));
const GameLayout = lazy(async () => ({ default: (await import('app/_game/layout')).GameLayout }));
const GameEngineProvider = lazy(async () => ({ default: (await import('app/_game/game-engine')).GameEngineProvider }));

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
        id="game-engine"
        path="/game/:serverSlug/:villageSlug/"
        element={<GameEngineProvider />}
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
