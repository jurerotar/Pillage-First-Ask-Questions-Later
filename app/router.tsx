import { lazy } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';

// Public
const PublicLayout = lazy(() => import('app/(public)/layout'));
const HomePage = lazy(() => import('app/(public)/(index)/page'));

// Game
const VillagePage = lazy(() => import('app/(game)/(village)/page'));
const BuildingPage = lazy(() => import('app/(game)/(village)/(...building-field-id)/page'));
const ReportPage = lazy(() => import('app/(game)/(reports)/(...report-id)/page'));
const MapPage = lazy(() => import('app/(game)/(map)/page'));
const ReportsPage = lazy(() => import('app/(game)/(reports)/page'));
const AuctionsPage = lazy(() => import('app/(game)/(auctions)/page'));
const GameLayout = lazy(() => import('app/(game)/layout'));

// Design system
const IconsPage = lazy(() => import('app/(design-system)/(icons)/page'));
const ColorPickerPage = lazy(() => import('app/(design-system)/(icons)/(color-picker)/page'));

const routes: RouteObject[] = [
  // Public paths
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      {
        element: <HomePage />,
        index: true,
      },
    ],
  },
  // Design-system paths
  {
    path: '/design-system',
    children: [
      {
        path: 'icons',
        children: [
          {
            element: <IconsPage />,
            index: true,
          },
          {
            path: 'color-picker',
            element: <ColorPickerPage />,
          },
        ],
      },
    ],
  },
  // Game paths
  {
    id: 'game',
    path: '/game/:serverSlug/:villageSlug/',
    children: [
      {
        element: <GameLayout />,
        children: [
          {
            path: 'resources',
            children: [
              {
                element: <VillagePage />,
                index: true,
              },
              {
                path: ':buildingFieldId',
                element: <BuildingPage />,
              },
            ],
          },
          {
            path: 'village',
            children: [
              {
                element: <VillagePage />,
                index: true,
              },
              {
                path: ':buildingFieldId',
                element: <BuildingPage />,
              },
            ],
          },
          {
            path: 'reports',
            children: [
              {
                element: <ReportsPage />,
                index: true,
              },
              {
                path: ':reportId',
                element: <ReportPage />,
              },
            ],
          },
          {
            path: 'auctions',
            element: <AuctionsPage />,
          },
          {
            path: 'map',
            element: <MapPage />,
          },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(routes, {
  future: {
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  },
});
