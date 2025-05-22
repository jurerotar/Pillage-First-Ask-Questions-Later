import { getMap } from 'app/(game)/api/handlers/map-handlers';
import { getVillageBySlug } from 'app/(game)/api/handlers/village-handlers';

export const apiRoutes = [
  {
    method: 'GET',
    path: '/map',
    handler: getMap,
  },
  {
    method: 'GET',
    path: '/villages/:villageSlug',
    handler: getVillageBySlug,
  },
  {
    method: 'GET',
    path: '/villages/:villageSlug/troops',
    handler: () => {},
  },
  {
    method: 'POST',
    path: '/villages',
    handler: () => {},
  },
] as const;
