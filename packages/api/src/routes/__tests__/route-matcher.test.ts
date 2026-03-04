import { describe, expect, test } from 'vitest';
import { matchRoute } from '../route-matcher';

describe('matchRoute', () => {
  test('casts path params using real schema (/villages/:villageId/troops)', () => {
    // This route exists in api-routes.ts and has a schema in open-api.ts
    const result = matchRoute('/villages/123/troops', 'GET');

    expect(typeof result.path.villageId).toBe('number');
    expect(result.path.villageId).toBe(123);
  });

  test('casts query params using real schema (/oasis-bonus-finder)', () => {
    // This route exists in api-routes.ts and has a query schema in open-api.ts
    const result = matchRoute('/oasis-bonus-finder?x=10&y=-20', 'GET');

    expect(result.query.x).toBe(10);
    expect(result.query.y).toBe(-20);
    expect(typeof result.query.x).toBe('number');
    expect(typeof result.query.y).toBe('number');
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

  test('casts path params using real schema (/players/:playerId/villages)', () => {
    // We updated this to use z.coerce.number() instead of playerSchema.shape.id
    const result = matchRoute('/players/456/villages', 'GET');

    expect(typeof result.path.playerId).toBe('number');
    expect(result.path.playerId).toBe(456);
  });
});
