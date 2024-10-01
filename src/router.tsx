import { lazy } from 'react';
import { type RouteObject, createBrowserRouter } from 'react-router-dom';

// Public
const PublicLayout = lazy(async () => ({ default: (await import('app/[public]/layout')).PublicLayout }));
const HomePage = lazy(async () => ({ default: (await import('app/[public]/[index]/page')).HomePage }));

// Game
const VillagePage = lazy(async () => ({ default: (await import('app/[game]/[village]/page')).VillagePage }));
const BuildingPage = lazy(async () => ({ default: (await import('app/[game]/[village]/[...building-field-id]/page')).BuildingPage }));
const ReportPage = lazy(async () => ({ default: (await import('app/[game]/[reports]/[...report-id]/page')).ReportPage }));
const MapPage = lazy(async () => ({ default: (await import('app/[game]/[map]/page')).MapPage }));
const ReportsPage = lazy(async () => ({ default: (await import('app/[game]/[reports]/page')).ReportsPage }));
const AuctionsPage = lazy(async () => ({ default: (await import('app/[game]/[auctions]/page')).AuctionsPage }));
const MapProvider = lazy(async () => ({ default: (await import('app/[game]/[map]/providers/map-context')).MapProvider }));
const GameLayout = lazy(async () => ({ default: (await import('app/[game]/layout')).GameLayout }));
const GameProviders = lazy(async () => ({ default: (await import('app/[game]/providers/game-providers')).GameProviders }));
const GameErrorBoundary = lazy(async () => ({ default: (await import('app/[game]/error-boundary')).GameErrorBoundary }));

// Design system
const IconsPage = lazy(async () => ({ default: (await import('app/[design-system]/[icons]/page')).IconsPage }));
const ColorPickerPage = lazy(async () => ({ default: (await import('app/[design-system]/[icons]/[color-picker]/page')).ColorPickerPage }));

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
    element: <GameProviders />,
    errorElement: <GameErrorBoundary />,
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
            element: (
              <MapProvider>
                <MapPage />
              </MapProvider>
            ),
          },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
