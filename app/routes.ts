import { index, layout, prefix, route, type RouteConfigEntry } from '@react-router/dev/routes';

export const routes: RouteConfigEntry[] = [
  layout('(public)/layout.tsx', [index('(public)/(index)/page.tsx')]),
  ...prefix('design-system', [
    route('icons', '(design-system)/(icons)/page.tsx', [route('color-picker', '(design-system)/(icons)/(color-picker)/page.tsx')]),
  ]),
  ...prefix('game/:serverSlug/:villageSlug', [
    layout('(game)/layout.tsx', [
      route(
        'resources',
        '(game)/(village)/page.tsx',
        {
          id: 'resources-page',
        },
        [
          route(':buildingFieldId', '(game)/(village)/(...building-field-id)/page.tsx', {
            id: 'resource-building-field-id-page',
          }),
        ],
      ),
      route(
        'village',
        '(game)/(village)/page.tsx',
        {
          id: 'village-page',
        },
        [
          route(':buildingFieldId', '(game)/(village)/(...building-field-id)/page.tsx', {
            id: 'village-building-field-id-page',
          }),
        ],
      ),
      route('reports', '(game)/(reports)/page.tsx', [route(':reportId', '(game)/(reports)/(...report-id)/page.tsx')]),
      route('auctions', '(game)/(auctions)/page.tsx'),
      route('map', '(game)/(map)/page.tsx'),
    ]),
  ]),
];
