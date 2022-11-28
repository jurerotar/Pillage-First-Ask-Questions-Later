import React, { useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import 'i18n/i18n';
import { AuthenticationGuard } from 'components/authentication-guard';
import { VillageView } from 'views/game/village-view';
import { ResourcesView } from 'views/game/resources-view';
import { HomeView } from 'views/home-view';
import { MapView } from 'views/game/map-view';
import { GameLayout } from 'layouts/game-layout';
import { DefaultLayout } from 'layouts/default-layout';
import { GameProvider } from 'providers/game/game-context';
import { VillageProvider } from 'providers/game/village-context';
import { HeroProvider } from 'providers/game/hero-context';
import { useContextSelector } from 'use-context-selector';
import { ApplicationContext } from 'providers/global/application-context';

export const App: React.FC = () => {
  const selectedServer = useContextSelector(ApplicationContext, (v) => v.selectedServer);
  const setSelectedServer = useContextSelector(ApplicationContext, (v) => v.setSelectedServer);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DefaultLayout />}>
          <Route
            path="/"
            element={<HomeView selectServerHandler={setSelectedServer} />}
          />
        </Route>
        <Route element={<AuthenticationGuard isAuthenticated={!!selectedServer} />}>
          <Route element={<GameProvider server={selectedServer!} />}>
            <Route element={<VillageProvider />}>
              <Route element={<HeroProvider />}>
                <Route element={<GameLayout />}>
                  <Route
                    path="/resources"
                    element={<ResourcesView />}
                  />
                  <Route
                    path="/village"
                    element={<VillageView />}
                  />
                  <Route
                    path="/map"
                    element={<MapView />}
                  />
                </Route>
              </Route>
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
