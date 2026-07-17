import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { compiledApiRoutes } from './api-routes';
import {
  type Controller,
  type ControllerOperationConfig,
  getJsonRequestBodySchema,
} from './controller';

const routesByMethodCache = new Map<string, typeof compiledApiRoutes>();
const routeCandidatesCache = new Map<
  string,
  Map<string, typeof compiledApiRoutes>
>();

type RouteRequestParamsConfig = Record<string, unknown> & {
  requestParams?: ControllerOperationConfig['requestParams'];
  requestBody?: ControllerOperationConfig['requestBody'];
};

const getFirstPathSegment = (path: string) => {
  const startIndex = path.startsWith('/') ? 1 : 0;
  const endIndex = path.indexOf('/', startIndex);

  return endIndex === -1
    ? path.slice(startIndex)
    : path.slice(startIndex, endIndex);
};

const isRouteCandidateForFirstSegment = (
  routePath: string,
  firstSegment: string,
) => {
  const routeFirstSegment = getFirstPathSegment(routePath);

  return (
    routeFirstSegment.startsWith(':') ||
    routeFirstSegment.startsWith('*') ||
    routeFirstSegment === firstSegment
  );
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

const getRouteCandidates = (method: string, path: string) => {
  const routesForMethod = getRoutesForMethod(method);
  const firstSegment = getFirstPathSegment(path);
  let candidatesByFirstSegment = routeCandidatesCache.get(method);

  if (!candidatesByFirstSegment) {
    candidatesByFirstSegment = new Map();
    routeCandidatesCache.set(method, candidatesByFirstSegment);
  }

  let candidates = candidatesByFirstSegment.get(firstSegment);

  if (!candidates) {
    candidates = routesForMethod.filter((route) =>
      isRouteCandidateForFirstSegment(route.path, firstSegment),
    );
    candidatesByFirstSegment.set(firstSegment, candidates);
  }

  return candidates;
};

export const matchRoute = (url: string, method: string, body?: unknown) => {
  const queryIndex = url.indexOf('?');
  const urlPath = queryIndex === -1 ? url : url.slice(0, queryIndex);
  const queryString = queryIndex === -1 ? undefined : url.slice(queryIndex + 1);
  const normalizedMethod = method.toUpperCase();

  // Replace only leading `/me` (either end or followed by slash), preserves trailing slash if present.
  const path = urlPath.replace(/^\/me(?=\/|$)/, `/players/${PLAYER_ID}`);

  const routeCandidates = getRouteCandidates(normalizedMethod, path);

  for (const route of routeCandidates) {
    const result = route.matcher(path) as
      | false
      | { path: string; params: Record<string, string> };

    if (!result) {
      continue;
    }

    const { params: rawPathParams } = result;

    const routeConfig = route.controller.operation as RouteRequestParamsConfig;

    const requestParams = routeConfig?.requestParams;
    const rawQuery: Record<string, string | string[]> = {};
    if (queryString) {
      for (const [key, value] of new URLSearchParams(queryString)) {
        const currentValue = rawQuery[key];
        if (currentValue === undefined) {
          rawQuery[key] = value;
        } else if (Array.isArray(currentValue)) {
          currentValue.push(value);
        } else {
          rawQuery[key] = [currentValue, value];
        }
      }
    }

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
