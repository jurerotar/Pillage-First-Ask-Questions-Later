import {
  index,
  layout,
  prefix,
  type RouteConfigEntry,
  route,
} from '@react-router/dev/routes';

export default [
  // Public routes
  layout('(public)/layout.tsx', [
    index('(public)/(index)/page.tsx'),
    route('get-involved', '(public)/(get-involved)/page.tsx'),
    route(
      'frequently-asked-questions',
      '(public)/(frequently-asked-questions)/page.tsx',
    ),
    ...prefix('game-worlds', [
      index('(public)/(game-worlds)/(index)/page.tsx'),
      route('create', '(public)/(game-worlds)/(create)/page.tsx'),
      route('import', '(public)/(game-worlds)/(import)/page.tsx'),
    ]),
    route('*', '(public)/(not-found)/page.tsx'),
  ]),
  // Design system routes
  ...prefix('design-system', [
    ...prefix('icons', [
      index('(design-system)/(icons)/page.tsx'),
      route('color-picker', '(design-system)/(icons)/(color-picker)/page.tsx'),
    ]),
  ]),
  // Game routes
  ...prefix('game', [
    ...prefix(':serverSlug', [
      layout('(game)/error-layout.tsx', [
        route('not-allowed', '(game)/(not-allowed)/page.tsx'),
        route('not-found', '(game)/(not-found)/page.tsx'),
      ]),
      // We need this route for relative navigation to work, it's otherwise completely empty
      route(':villageSlug', '(game)/(village-slug)/page.tsx', [
        layout('(game)/layout.tsx', [
          layout('(game)/(village-slug)/layout.tsx', [
            route('resources', '(game)/(village-slug)/(village)/page.tsx', {
              id: 'resources-page',
            }),
            route('village', '(game)/(village-slug)/(village)/page.tsx', {
              id: 'village-page',
            }),
            route('map', '(game)/(village-slug)/(map)/page.tsx'),
            layout('(game)/(village-slug)/fixed-width-layout.tsx', [
              route(
                'resources/:buildingFieldId',
                '(game)/(village-slug)/(village)/(...building-field-id)/page.tsx',
                {
                  id: 'resource-building-field-id-page',
                },
              ),
              route(
                'village/:buildingFieldId',
                '(game)/(village-slug)/(village)/(...building-field-id)/page.tsx',
                {
                  id: 'village-building-field-id-page',
                },
              ),
              route(
                'production-overview',
                '(game)/(village-slug)/(production-overview)/page.tsx',
              ),
              route('hero', '(game)/(village-slug)/(hero)/page.tsx'),
              route(
                'preferences',
                '(game)/(village-slug)/(preferences)/page.tsx',
              ),
              route(
                'statistics',
                '(game)/(village-slug)/(statistics)/page.tsx',
              ),
              route('overview', '(game)/(village-slug)/(overview)/page.tsx'),
              route('quests', '(game)/(village-slug)/(quests)/page.tsx'),
              ...prefix('reports', [
                index('(game)/(village-slug)/(reports)/page.tsx'),
                route(
                  ':reportId',
                  '(game)/(village-slug)/(reports)/(...report-id)/page.tsx',
                ),
              ]),
            ]),
          ]),
        ]),
      ]),
    ]),
  ]),
  route('__spa-preload', '(internal)/(spa-preload)/page.tsx'),
] satisfies RouteConfigEntry[];
