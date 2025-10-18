import { compiledApiRoutes } from 'app/(game)/api/api-routes';
import { describe, test, expect } from 'vitest';

describe('API route definitions', () => {
  test('Every route path starts with `/` and does not end with `/` (unless root)', () => {
    const invalidRoutes = compiledApiRoutes.filter(({ path }) => {
      return !path.startsWith('/') || (path.length > 1 && path.endsWith('/'));
    });

    expect(invalidRoutes).toStrictEqual([]);
  });
});
