import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { serverMock } from '@pillage-first/mocks/server';
import { calculateGridLayout } from '@pillage-first/utils/map';
import { prepareTestDatabase } from '../../';

const database = await prepareTestDatabase();

describe('playersSeeder', () => {
  test('slugs are unique and contain only lowercase alphanumeric and dashes', () => {
    const slugs = database.selectValues({
      sql: 'SELECT slug FROM players;',
      schema: z.string(),
    });

    const distinctCount = database.selectValue({
      sql: 'SELECT COUNT(DISTINCT slug) AS c FROM players;',
      schema: z.number(),
    });

    expect(distinctCount).toBe(slugs.length);

    for (const s of slugs) {
      expect(/^[a-z0-9-]+$/.test(s)).toBe(true);
      expect(s).not.toMatch(/^-/);
      expect(s).not.toMatch(/-$/);
    }
  });

  test('only one player has faction_id = 1 and that player has id = 1', () => {
    const count = database.selectValue({
      sql: 'SELECT COUNT(*) AS c FROM players WHERE faction_id = 1;',
      schema: z.number(),
    });
    expect(count).toBe(1);
  });

  test('player count equals expected formula (player + generated NPCs)', () => {
    const { totalTiles } = calculateGridLayout(
      serverMock.configuration.mapSize,
    );
    const playerDensity = 0.046;
    const expectedTotalPlayers =
      Math.round((playerDensity * totalTiles) / 100) * 100;

    const actualCount = database.selectValue({
      sql: 'SELECT COUNT(*) AS c FROM players;',
      schema: z.number(),
    });

    expect(actualCount).toBe(expectedTotalPlayers);
  });

  test('all NPC reputation tiers (by faction) are represented by at least one player', () => {
    const playerFactionId = database.selectValue({
      sql: 'SELECT faction_id FROM players WHERE id = $player_id;',
      bind: { $player_id: PLAYER_ID },
      schema: z.number(),
    })!;

    const targetFactionIds = database.selectValues({
      sql: `
        SELECT target_faction_id
        FROM faction_reputation
        WHERE source_faction_id = $src
      `,
      bind: { $src: playerFactionId },
      schema: z.number(),
    });

    expect(targetFactionIds.length).toBeGreaterThan(0);

    for (const tfid of targetFactionIds) {
      const cnt = database.selectValue({
        sql: 'SELECT COUNT(*) AS c FROM players WHERE faction_id = $fid AND id != $player_id;',
        bind: { $fid: tfid, $player_id: PLAYER_ID },
        schema: z.number(),
      });
      expect(cnt).toBeGreaterThan(0);
    }
  });

  test('every player has a valid tribe_id', () => {
    const invalidTribeCount = database.selectValue({
      sql: 'SELECT COUNT(*) FROM players WHERE tribe_id IS NULL OR tribe_id NOT IN (SELECT id FROM tribe_ids);',
      schema: z.number(),
    });
    expect(invalidTribeCount).toBe(0);
  });
});
