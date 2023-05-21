import React from 'react';
import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';
import { PublicLayout } from 'app/(public)/layout';
import { HomePage } from 'app/(public)/home/page';
import { GameProviders } from 'app/(game)/game-providers';
import { TestPage } from 'app/(test)/test/page';

export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
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
        path="/game/:serverId/"
        element={<GameProviders />}
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
          path="map"
          element={<TestPage />}
        />
      </Route>
    </>
  )
);
