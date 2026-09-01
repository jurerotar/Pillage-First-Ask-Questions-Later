import { describe, expect, test } from 'vitest';
import { matchRoute } from '../route-matcher';

describe(matchRoute, () => {
  test('casts path params using real schema (/tiles/:tileId/stationed-troops)', () => {
    // This route exists in http/api-routes.ts and has a schema in the OpenAPI contract.
    const result = matchRoute('/tiles/123/stationed-troops', 'GET');

    expect(typeof result.path.tileId).toBe('number');
    expect(result.path.tileId).toBe(123);
  });

  test('matches routes regardless of method casing', () => {
    const result = matchRoute('/tiles/123/stationed-troops', 'get');

    expect(result.controller.path).toBe('/tiles/:tileId/stationed-troops');
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

  test('accepts complete troop movement event bodies', () => {
    const result = matchRoute('/events', 'POST', {
      type: 'troopMovementAttack',
      villageId: 1,
      originTileId: 1,
      targetTileId: 2,
      troops: [
        {
          unitId: 'LEGIONNAIRE',
          amount: 1,
          tileId: 1,
          sourceTileId: 1,
        },
      ],
    });

    expect(result.body).toStrictEqual({
      type: 'troopMovementAttack',
      villageId: 1,
      originTileId: 1,
      targetTileId: 2,
      troops: [
        {
          unitId: 'LEGIONNAIRE',
          amount: 1,
          tileId: 1,
          sourceTileId: 1,
        },
      ],
    });
  });

  test('rejects troop movement event bodies with incomplete troops', () => {
    expect(() =>
      matchRoute('/events', 'POST', {
        type: 'troopMovementAttack',
        villageId: 1,
        originTileId: 1,
        targetTileId: 2,
        troops: [
          {
            unitId: 'LEGIONNAIRE',
            amount: 1,
            sourceTileId: 1,
          },
        ],
      }),
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
    // tileId is coerced to number, so 'not-a-number' should fail
    expect(() =>
      matchRoute('/tiles/not-a-number/stationed-troops', 'GET'),
    ).toThrow();
  });

  test('includes raw url in result', () => {
    const url = '/tiles/123/stationed-troops?foo=bar';
    const result = matchRoute(url, 'GET');

    expect(result.url).toBe(url);
  });

  test('preserves repeated query params as arrays', () => {
    const result = matchRoute(
      '/reports?scope=village&villageId=2&filters=adventure&filters=movement&filters=trade',
      'GET',
    );

    expect(result.query.villageId).toBe(2);
    expect(result.query.filters).toStrictEqual([
      'adventure',
      'movement',
      'trade',
    ]);
  });
});
