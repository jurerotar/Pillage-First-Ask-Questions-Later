import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { compiledApiRoutes } from './api-routes';
import {
  type Controller,
  type ControllerOperationConfig,
  getJsonRequestBodySchema,
} from './controller';

const routesByMethodCache = new Map<string, typeof compiledApiRoutes>();

type RouteRequestParamsConfig = Record<string, unknown> & {
  requestParams?: ControllerOperationConfig['requestParams'];
  requestBody?: ControllerOperationConfig['requestBody'];
};

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

    const routeConfig = route.controller.operation as RouteRequestParamsConfig;

    const requestParams = routeConfig?.requestParams;

    const pathParams = requestParams?.path
      ? requestParams.path.parse(rawPathParams)
      : rawPathParams;

    const queryParams = requestParams?.query
      ? requestParams.query.parse(rawQuery)
      : rawQuery;

    const bodySchema = getJsonRequestBodySchema(routeConfig?.requestBody);
    const parsedBody = bodySchema ? bodySchema.parse(body) : body;

    return {
      controller: route.controller as Controller,
      path: pathParams as Record<string, string | number>,
      query: queryParams as Record<string, string | number>,
      body: parsedBody,
      url,
    };
  }

  throw new Error(`Cannot match route ${normalizedMethod}::${url}`);
};
