import { index, layout, prefix, route, type RouteConfigEntry } from '@react-router/dev/routes';

export default [
  // Public routes
  layout('(public)/layout.tsx', [index('(public)/(index)/page.tsx'), route('create-new-server', '(public)/(create-new-server)/page.tsx')]),
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
      route('resources', '(game)/(village)/page.tsx', { id: 'resources-page' }),
      route('village', '(game)/(village)/page.tsx', { id: 'village-page' }),
      route('map', '(game)/(map)/page.tsx'),
      layout('(game)/fixed-width-layout.tsx', [
        route('resources/:buildingFieldId', '(game)/(village)/(...building-field-id)/page.tsx', { id: 'resource-building-field-id-page' }),
        route('village/:buildingFieldId', '(game)/(village)/(...building-field-id)/page.tsx', { id: 'village-building-field-id-page' }),
        route('hero', '(game)/(hero)/page.tsx'),
        route('preferences', '(game)/(preferences)/page.tsx'),
        route('statistics', '(game)/(statistics)/page.tsx'),
        ...prefix('reports', [index('(game)/(reports)/page.tsx'), route(':reportId', '(game)/(reports)/(...report-id)/page.tsx')]),
        ...prefix('quests', [index('(game)/(quests)/page.tsx'), route(':questId', '(game)/(quests)/(...quest-id)/page.tsx')]),
      ]),
    ]),
  ]),
] satisfies RouteConfigEntry[];
