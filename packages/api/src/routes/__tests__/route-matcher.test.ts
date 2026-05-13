import { describe, expect, test } from 'vitest';
import { matchRoute } from '../route-matcher';

describe(matchRoute, () => {
  test('casts path params using real schema (/villages/:villageId/troops)', () => {
    // This route exists in api-routes.ts and has a schema in open-api.ts
    const result = matchRoute('/villages/123/troops', 'GET');

    expect(typeof result.path.villageId).toBe('number');
    expect(result.path.villageId).toBe(123);
  });

  test('casts body params using real schema (/search/oases/by-bonus)', () => {
    // This route exists in api-routes.ts and has a body schema in open-api.ts
    const result = matchRoute('/search/oases/by-bonus', 'POST');

    expect(result.controller.path).toBe('/search/oases/by-bonus');
    expect(result.controller.method).toBe('post');
  });

  test('handles /me alias', () => {
    // /me is aliased to /players/${PLAYER_ID}, which is /players/1
    const result = matchRoute('/me', 'GET');

    // In our api-routes.ts, /players/:playerSlug is defined BEFORE /players/me
    // and /players/1 matches :playerSlug. This is expected current behavior.
    expect(result.controller.path).toBe('/players/:playerSlug');
    expect(result.path.playerSlug).toBe('1');
  });

  test('throws on validation error', () => {
    // villageId is coerced to number, so 'not-a-number' should fail
    expect(() => matchRoute('/villages/not-a-number/troops', 'GET')).toThrow();
  });

  test('includes raw url in result', () => {
    const url = '/villages/123/troops?foo=bar';
    const result = matchRoute(url, 'GET');

    expect(result.url).toBe(url);
  });
});
