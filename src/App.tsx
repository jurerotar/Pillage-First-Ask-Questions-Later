import React, { useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import 'i18n/i18n';
import AuthenticationGuard from 'components/authentication-guard';
import VillageView from 'views/game/village-view';
import ResourcesView from 'views/game/resources-view';
import HomeView from 'views/home-view';
import MapView from 'views/game/map-view';
import GameLayout from 'layouts/game-layout';
import DefaultLayout from 'layouts/default-layout';
import { GameProvider } from 'providers/game/game-context';
import { VillageProvider } from 'providers/game/village-context';
import { HeroProvider } from 'providers/game/hero-context';
import { Server } from 'interfaces/models/game/server';

const App: React.FC = (): JSX.Element => {
  const [server, setServer] = useState<Server | null>(null);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DefaultLayout />}>
          <Route
            path="/"
            element={<HomeView selectServerHandler={setServer} />}
          />
        </Route>
        <Route element={<AuthenticationGuard isAuthenticated={!!server} />}>
          <Route element={<GameProvider server={server!} />}>
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

export default App;
