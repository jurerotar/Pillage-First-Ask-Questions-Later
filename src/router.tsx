import { createBrowserRouter } from 'react-router-dom';
import { PublicLayout } from 'layouts/public-layout';
import { HomeView } from 'views/home-view';
import { GameProviders } from 'layouts/game/game-providers';
import { TestView } from 'views/game/test-view';
import React from 'react';

export const router = createBrowserRouter([
  // Public routes
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: <HomeView />
      }
    ]
  },
  // Game routes
  {
    path: '/game/:serverId/',
    element: <GameProviders />,
    errorElement: <>Error at App</>,
    children: [
      {
        path: 'resources',
        element: <TestView />
      },
      {
        path: 'village',
        element: <TestView />
      },
      {
        path: 'map',
        element: <TestView />
      }
    ]
  }
]);
