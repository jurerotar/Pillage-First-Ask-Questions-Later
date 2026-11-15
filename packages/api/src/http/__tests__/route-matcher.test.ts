import { describe, expect, test } from 'vitest';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { matchRoute } from '../route-matcher';

describe(matchRoute, () => {
  test('creates independent current-player context for each request', () => {
    const first = matchRoute('/tiles/123/stationed-troops?playerId=999', 'GET');
    const second = matchRoute('/tiles/123/stationed-troops', 'GET');

    expect(first.context.playerId).toBe(PLAYER_ID);
    expect(second.context.playerId).toBe(PLAYER_ID);
    expect(first.context).not.toBe(second.context);
  });

  test('keeps supplied identity in context without adding it to route parameters', () => {
    const context = { playerId: 42 };
    const result = matchRoute('/me/villages', 'GET', undefined, context);
    const next = matchRoute('/me/villages', 'GET');

    expect(result.context).toBe(context);
    expect(Object.keys(result.path)).toHaveLength(0);
    expect(next.context.playerId).toBe(PLAYER_ID);
  });

  test('casts path params using real schema (/tiles/:tileId/stationed-troops)', () => {
    // This route exists in http/api-routes.ts and has a request parameter schema.
    const result = matchRoute('/tiles/123/stationed-troops', 'GET');

    expect(result.path.tileId).toBeTypeOf('number');
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

  test('matches QUERY routes with request bodies', () => {
    const body = {
      x: 0,
      y: 0,
      animalFilters: [{ animal: 'RAT', amount: 1 }],
    };

    const result = matchRoute('/search/oases/by-animals', 'QUERY', body);

    expect(result.controller.path).toBe('/search/oases/by-animals');
    expect(result.controller.method).toBe('query');
    expect(result.body).toStrictEqual(body);
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

  test('matches /me as a real current-player endpoint', () => {
    const result = matchRoute('/me', 'GET');

    expect(result.controller.path).toBe('/me');
    expect(Object.keys(result.path)).toHaveLength(0);
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
      '/tiles/123/stationed-troops?filters=adventure&filters=movement&filters=trade',
      'GET',
    );

    expect(result.query.filters).toStrictEqual([
      'adventure',
      'movement',
      'trade',
    ]);
  });
});
