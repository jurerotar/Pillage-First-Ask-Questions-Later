import React from 'react';
import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';
import { PublicLayout } from 'app/(public)/layout';
import { HomePage } from 'app/(public)/home/page';
import { TestPage } from 'app/(test)/test/page';
import { MapPage } from 'app/(game)/map/page';
import { AppLayout } from 'app/layout';
import { GameLayout } from 'app/(game)/layout';
import { GameEngineProvider } from 'app/(game)/game-engine';

// TODO: Lazy load pages with @loadable
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
          <Route
            index
            path="map"
            element={<MapPage />}
          />
        </Route>
      </Route>
    </Route>
  )
);
