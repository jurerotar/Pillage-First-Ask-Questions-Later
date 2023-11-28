import React, { lazy } from 'react';
import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';
import { AppLayout } from 'app/layout';
import { gameLoader } from 'app/(game)/loader';
import { GameErrorBoundary } from 'app/(game)/error-boundary';

const PublicLayout = lazy(async () => ({ default: (await import('app/(public)/layout')).PublicLayout }));
const HomePage = lazy(async () => ({ default: (await import('app/(public)/home/page')).HomePage }));
const MapPage = lazy(async () => ({ default: (await import('app/(game)/map/page')).MapPage }));
const MapProvider = lazy(async () => ({ default: (await import('app/(game)/map/providers/map-context')).MapProvider }));
const GameLayout = lazy(async () => ({ default: (await import('app/(game)/layout')).GameLayout }));
const GameEngineProvider = lazy(async () => ({ default: (await import('app/(game)/game-engine')).GameEngineProvider }));
const TestPage = lazy(async () => ({ default: (await import('app/(test)/test/page')).TestPage }));

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
            element={<TestPage />}
          />
          <Route
            path="villages"
            element={<TestPage />}
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
