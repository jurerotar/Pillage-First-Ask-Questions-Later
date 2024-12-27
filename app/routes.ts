import { index, layout, prefix, route, type RouteConfigEntry } from '@react-router/dev/routes';

export default [
  // Public routes
  layout('(public)/layout.tsx', [index('(public)/(index)/page.tsx')]),
  // Design system routes
  ...prefix('design-system', [
    ...prefix('icons', [
      index('(design-system)/(icons)/page.tsx'),
      route('color-picker', '(design-system)/(icons)/(color-picker)/page.tsx'),
    ]),
  ]),
  // Game routes
  ...prefix('game/:serverSlug/:villageSlug', [
    layout('(game)/layout.tsx', [
      ...prefix('resources', [
        index('(game)/(village)/page.tsx', {
          id: 'resources-page',
        }),
        route(':buildingFieldId', '(game)/(village)/(...building-field-id)/page.tsx', {
          id: 'resource-building-field-id-page',
        }),
      ]),
      ...prefix('village', [
        index('(game)/(village)/page.tsx', {
          id: 'village-page',
        }),
        route(':buildingFieldId', '(game)/(village)/(...building-field-id)/page.tsx', {
          id: 'village-building-field-id-page',
        }),
      ]),
      ...prefix('reports', [index('(game)/(reports)/page.tsx'), route(':reportId', '(game)/(reports)/(...report-id)/page.tsx')]),
      route('auctions', '(game)/(auctions)/page.tsx'),
      route('map', '(game)/(map)/page.tsx'),
    ]),
  ]),
] satisfies RouteConfigEntry[];
