import React, { lazy } from 'react';
import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';
import { AppLayout } from 'app/layout';

const PublicLayout = lazy(async () => ({ default: (await import('app/(public)/layout')).PublicLayout }));
const HomePage = lazy(async () => ({ default: (await import('app/(public)/home/page')).HomePage }));
const MapPage = lazy(async () => ({ default: (await import('app/(game)/map/page')).MapPage }));
const MapProvider = lazy(async () => ({ default: (await import('app/(game)/map/providers/map-context')).MapProvider }));
const GameLayout = lazy(async () => ({ default: (await import('app/(game)/layout')).GameLayout }));
const GameEngineProvider = lazy(async () => ({ default: (await import('app/(game)/game-engine')).GameEngineProvider }));
const GameLoader = lazy(async () => ({ default: (await import('app/(game)/loader')).GameLoader }));
const TestPage = lazy(async () => ({ default: (await import('app/(test)/test/page')).TestPage }));

// TODO: Add <Suspense> with fallbacks
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
      {/* TODO: Since <GameLoader> is just warming up the cache, it can probably be replaced by a native loader function */}
      <Route element={<GameLoader />}>
        <Route element={<GameEngineProvider />}>
          <Route
            path="/game/:serverSlug/:villageSlug/"
            element={<GameLayout />}
          >
            <Route
              path="resources"
              element={<TestPage />}
            />
            <Route
              path="villages"
              element={<TestPage />}
            />
            <Route element={<MapProvider />}>
              <Route
                index
                path="map"
                element={<MapPage />}
              />
            </Route>
          </Route>
        </Route>
      </Route>
    </Route>
  )
);
