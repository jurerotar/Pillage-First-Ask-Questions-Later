import { describe, expect, test } from 'vitest';
import { paths } from '../../open-api';
import { compiledApiRoutes } from '../api-routes';

const httpMethods = new Set(['get', 'post', 'put', 'delete', 'patch']);

const hasInvalidPathFormat = (path: string) =>
  !path.startsWith('/') || (path.length > 1 && path.endsWith('/'));

const getRouteSegments = (path: string) => path.split('/').filter(Boolean);

const isParameterSegment = (segment: string) =>
  segment.startsWith(':') || segment.startsWith('*');

const segmentShadowsRouteSegment = (
  earlierSegment: string,
  laterSegment: string,
) => {
  if (isParameterSegment(earlierSegment)) {
    return true;
  }

  if (isParameterSegment(laterSegment)) {
    return false;
  }

  return earlierSegment === laterSegment;
};

const routeShadowsRoute = (
  earlierRoute: (typeof compiledApiRoutes)[number],
  laterRoute: (typeof compiledApiRoutes)[number],
) => {
  if (earlierRoute.method !== laterRoute.method) {
    return false;
  }

  const earlierSegments = getRouteSegments(earlierRoute.path);
  const laterSegments = getRouteSegments(laterRoute.path);

  if (earlierSegments.length !== laterSegments.length) {
    return false;
  }

  return earlierSegments.every((earlierSegment, index) =>
    segmentShadowsRouteSegment(earlierSegment, laterSegments[index]),
  );
};

describe('api-route definitions', () => {
  test('every route path starts with `/` and does not end with `/` (unless root)', () => {
    const invalidRoutes = compiledApiRoutes.filter(({ path }) =>
      hasInvalidPathFormat(path),
    );

    expect(invalidRoutes).toStrictEqual([]);
  });

  test('does not register duplicate route handlers', () => {
    const routeKeys = compiledApiRoutes.map(
      ({ method, path }) => `${method} ${path}`,
    );

    expect(new Set(routeKeys).size).toBe(routeKeys.length);
  });

  test('does not register routes shadowed by earlier routes', () => {
    const shadowedRoutes = compiledApiRoutes.flatMap((laterRoute, index) => {
      const shadowingRoutes = compiledApiRoutes
        .slice(0, index)
        .filter((earlierRoute) => routeShadowsRoute(earlierRoute, laterRoute));

      return shadowingRoutes.map(
        (shadowingRoute) =>
          `${laterRoute.method} ${laterRoute.path} is shadowed by ${shadowingRoute.method} ${shadowingRoute.path}`,
      );
    });

    expect(shadowedRoutes).toStrictEqual([]);
  });

  test('every registered route has a matching OpenAPI operation', () => {
    const contractedRouteKeys = new Set(
      Object.entries(paths).flatMap(([path, routeConfig]) => {
        return Object.keys(routeConfig)
          .filter((method) => httpMethods.has(method))
          .map((method) => `${method.toUpperCase()} ${path}`);
      }),
    );

    const routesWithoutContract = compiledApiRoutes
      .map(({ method, path }) => `${method} ${path}`)
      .filter((routeKey) => !contractedRouteKeys.has(routeKey));

    expect(routesWithoutContract).toStrictEqual([]);
  });
});
