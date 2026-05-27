import { describe, expect, test } from 'vitest';
import { paths } from '../../open-api';
import { compiledApiRoutes } from '../api-routes';

const httpMethods = new Set(['get', 'post', 'put', 'delete', 'patch']);

describe('api-route definitions', () => {
  test('every route path starts with `/` and does not end with `/` (unless root)', () => {
    const invalidRoutes = compiledApiRoutes.filter(({ path }) => {
      return !path.startsWith('/') || (path.length > 1 && path.endsWith('/'));
    });

    expect(invalidRoutes).toStrictEqual([]);
  });

  test('does not register duplicate route handlers', () => {
    const routeKeys = compiledApiRoutes.map(
      ({ method, path }) => `${method} ${path}`,
    );

    expect(new Set(routeKeys).size).toBe(routeKeys.length);
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
