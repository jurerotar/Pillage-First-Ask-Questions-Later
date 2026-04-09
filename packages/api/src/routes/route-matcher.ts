import type { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { paths } from '../open-api';
import type { Method } from '../utils/controller';
import { compiledApiRoutes } from './api-routes';

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
  const rawQuery = Object.fromEntries(new URLSearchParams(queryString));

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

    const { params: rawPathParams } = result;

    const pathKey = route.path;
    const methodKey = method.toLowerCase() as Method;

    const routeConfig = (paths[pathKey] as any)[methodKey] as
      | {
          requestParams?: {
            path?: z.ZodType;
            query?: z.ZodType;
          };
        }
      | undefined;

    const requestParams = routeConfig?.requestParams;

    const pathParams = requestParams?.path
      ? requestParams.path.parse(rawPathParams)
      : rawPathParams;

    const queryParams = requestParams?.query
      ? requestParams.query.parse(rawQuery)
      : rawQuery;

    return {
      controller: route.controller,
      path: pathParams as Record<string, string | number>,
      query: queryParams as Record<string, string | number>,
      url,
    };
  }

  throw new Error(`Cannot match route ${method}::${url}`);
};
