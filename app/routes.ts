import {
  index,
  layout,
  prefix,
  route,
  type RouteConfigEntry,
} from '@react-router/dev/routes';

export default [
  // Public routes
  layout('(public)/layout.tsx', [
    index('(public)/(index)/page.tsx'),
    route('create-new-server', '(public)/(create-new-server)/page.tsx'),
  ]),
  // Design system routes
  ...prefix('design-system', [
    ...prefix('icons', [
      index('(design-system)/(icons)/page.tsx'),
      route('color-picker', '(design-system)/(icons)/(color-picker)/page.tsx'),
    ]),
  ]),
  // Error pages
  ...prefix('error', [
    layout('(error)/layout.tsx', [
      route('403', '(error)/(403)/page.tsx'),
      route('404', '(error)/(404)/page.tsx'),
    ]),
  ]),
  // Game routes
  ...prefix('game/:serverSlug', [
    layout('(game)/layout.tsx', [
      ...prefix('/:villageSlug', [
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
            route('statistics', '(game)/(village-slug)/(statistics)/page.tsx'),
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
  route('__spa-preload', '(internal)/(spa-preload)/page.tsx'),
] satisfies RouteConfigEntry[];
