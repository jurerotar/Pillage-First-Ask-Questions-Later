import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { compiledApiRoutes } from '../routes/api-routes';

// These params are automatically cast as numbers
const numericParams = new Set([
  'playerId',
  'villageId',
  'tileId',
  'oasisId',
  'x',
  'y',
]);

const routesByMethodCache = new Map<string, typeof compiledApiRoutes>();

const getRoutesForMethod = (method: string) => {
  let cached = routesByMethodCache.get(method);

  if (!cached) {
    cached = compiledApiRoutes.filter((r) => r.method === method);
    routesByMethodCache.set(method, cached);
  }

  return cached;
};

export const matchRoute = (url: string, method: string) => {
  const [urlPath, queryString] = url.split('?');
  const query: Record<string, string | number> = Object.fromEntries(
    new URLSearchParams(queryString),
  );

  // Replace only leading `/me` (either end or followed by slash), preserves trailing slash if present.
  const path = urlPath.replace(/^\/me(?=\/|$)/, `/players/${PLAYER_ID}`);

  const routesForMethod = getRoutesForMethod(method);

  for (const route of routesForMethod) {
    const result = route.matcher(path) as
      | false
      | { path: string; params: Record<string, string> };

    if (!result) {
      continue;
    }

    // Only clone params if we actually need to cast any numeric values
    let params: Record<string, string | number> | Record<string, string> =
      result.params;

    for (const [key, rawValue] of Object.entries(result.params)) {
      if (!numericParams.has(key)) {
        continue;
      }

      const n = Number.parseInt(rawValue, 10);
      if (!Number.isNaN(n)) {
        // Clone lazily on first numeric conversion
        if (params === result.params) {
          params = {
            ...result.params,
          };
        }
        params[key] = n;
      }
    }

    // Also cast numeric query params
    for (const [key, rawValue] of Object.entries(query)) {
      if (!numericParams.has(key)) {
        continue;
      }

      const n =
        typeof rawValue === 'string' ? Number.parseInt(rawValue, 10) : rawValue;
      if (!Number.isNaN(n)) {
        query[key] = n;
      }
    }

    return {
      handler: route.handler,
      params,
      query,
    };
  }

  throw new Error(`Cannot match route ${method}::${url}`);
};
