import { describe, expect, test } from 'vitest';
import { matchRoute } from '../route-matcher';

describe(matchRoute, () => {
  test('casts path params using real schema (/villages/:villageId/troops)', () => {
    // This route exists in http/api-routes.ts and has a schema in the OpenAPI contract.
    const result = matchRoute('/villages/123/troops', 'GET');

    expect(typeof result.path.villageId).toBe('number');
    expect(result.path.villageId).toBe(123);
  });

  test('matches routes regardless of method casing', () => {
    const result = matchRoute('/villages/123/troops', 'get');

    expect(result.controller.path).toBe('/villages/:villageId/troops');
  });

  test('matches body routes using real schema', () => {
    const result = matchRoute(
      '/villages/123/bookmarks/MAIN_BUILDING',
      'PATCH',
      {
        tab: 'overview',
      },
    );

    expect(result.controller.path).toBe(
      '/villages/:villageId/bookmarks/:buildingId',
    );
    expect(result.controller.method).toBe('patch');
  });

  test('parses request bodies using real schema', () => {
    const result = matchRoute(
      '/villages/123/bookmarks/MAIN_BUILDING',
      'PATCH',
      {
        tab: 'overview',
      },
    );

    expect(result.body).toStrictEqual({ tab: 'overview' });
  });

  test('throws on body validation error', () => {
    expect(() =>
      matchRoute('/villages/123/bookmarks/MAIN_BUILDING', 'PATCH', { tab: 1 }),
    ).toThrow();
  });

  test('handles /me alias', () => {
    // /me is aliased to /players/${PLAYER_ID}, which is /players/1
    const result = matchRoute('/me', 'GET');

    // In http/api-routes.ts, /players/:playerSlug is defined BEFORE /players/me
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
