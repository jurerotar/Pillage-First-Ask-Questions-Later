import type { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { paths } from '../open-api';
import { compiledApiRoutes } from './api-routes';
import type { Method } from './controller';

const routesByMethodCache = new Map<string, typeof compiledApiRoutes>();

type RouteRequestParamsConfig = Record<string, unknown> & {
  requestParams?: {
    path?: z.ZodType;
    query?: z.ZodType;
  };
  requestBody?: {
    content?: {
      'application/json'?: {
        schema?: z.ZodType;
      };
    };
  };
};

type RouteMethodsConfig = Partial<Record<Method, RouteRequestParamsConfig>>;

const getRoutesForMethod = (method: string) => {
  const normalizedMethod = method.toUpperCase();
  let cached = routesByMethodCache.get(normalizedMethod);

  if (!cached) {
    cached = compiledApiRoutes.filter((r) => r.method === normalizedMethod);
    routesByMethodCache.set(normalizedMethod, cached);
  }

  return cached;
};

export const matchRoute = (url: string, method: string, body?: unknown) => {
  const [urlPath, queryString] = url.split('?');
  const rawQuery = Object.fromEntries(new URLSearchParams(queryString));
  const normalizedMethod = method.toUpperCase();

  // Replace only leading `/me` (either end or followed by slash), preserves trailing slash if present.
  const path = urlPath.replace(/^\/me(?=\/|$)/, `/players/${PLAYER_ID}`);

  const routesForMethod = getRoutesForMethod(normalizedMethod);

  for (const route of routesForMethod) {
    const result = route.matcher(path) as
      | false
      | { path: string; params: Record<string, string> };

    if (!result) {
      continue;
    }

    const { params: rawPathParams } = result;

    const pathKey = route.path;
    const methodKey = normalizedMethod.toLowerCase() as Method;

    const routeConfigByMethod: RouteMethodsConfig = paths[pathKey];
    const routeConfig = routeConfigByMethod[methodKey];

    const requestParams = routeConfig?.requestParams;

    const pathParams = requestParams?.path
      ? requestParams.path.parse(rawPathParams)
      : rawPathParams;

    const queryParams = requestParams?.query
      ? requestParams.query.parse(rawQuery)
      : rawQuery;

    const bodySchema =
      routeConfig?.requestBody?.content?.['application/json']?.schema;
    const parsedBody = bodySchema ? bodySchema.parse(body) : body;

    return {
      controller: route.controller,
      path: pathParams as Record<string, string | number>,
      query: queryParams as Record<string, string | number>,
      body: parsedBody,
      url,
    };
  }

  throw new Error(`Cannot match route ${normalizedMethod}::${url}`);
};
