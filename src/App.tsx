import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import 'i18n/i18n';
import AuthenticationGuard from 'components/authentication-guard';
import VillageView from 'views/village-view';
import ResourcesView from 'views/resources-view';
import HomeView from 'views/home-view';
import MapView from 'views/map-view';
import ReportsView from 'views/reports-view';
import HeroView from 'views/hero-view';
import GameLayout from 'layouts/game-layout';
import DefaultLayout from 'layouts/default-layout';
import { ResourcesProvider } from 'providers/resources-context';
import { useContextSelector } from 'use-context-selector';
import { GameContext } from 'providers/game-context';

const App: React.FC = (): JSX.Element => {
  const hasGameLoaded = useContextSelector(GameContext, (v) => v.hasGameDataLoaded);
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DefaultLayout />}>
          <Route
            path="/"
            element={<HomeView />}
          />
        </Route>
        <Route element={<AuthenticationGuard isAuthenticated={hasGameLoaded} />}>
          <Route element={<GameLayout />}>
            <Route element={<ResourcesProvider />}>
              <Route
                path="/hero"
                element={<HeroView />}
              />
              <Route
                path="/resources"
                element={<ResourcesView />}
              />
              <Route
                path="/village"
                element={<VillageView />}
              />
            </Route>
            <Route
              path="/map"
              element={<MapView />}
            />
            <Route
              path="/reports"
              element={<ReportsView />}
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
