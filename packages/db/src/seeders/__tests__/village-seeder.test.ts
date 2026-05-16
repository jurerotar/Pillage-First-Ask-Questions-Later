import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '../../';

const database = await prepareTestDatabase();

describe('villageSeeder', () => {
  test('villages seeded (>0)', () => {
    const c = database.selectValue({
      sql: 'SELECT COUNT(*) FROM villages;',
      schema: z.number(),
    });
    expect(c).toBeGreaterThan(0);
  });

  test('every village belongs to a player', () => {
    const invalidVillages = database.selectValue({
      sql: 'SELECT COUNT(*) FROM villages WHERE player_id IS NULL OR player_id NOT IN (SELECT id FROM players);',
      schema: z.number(),
    });
    expect(invalidVillages).toBe(0);
  });

  test('every village is on a tile', () => {
    const invalidVillages = database.selectValue({
      sql: 'SELECT COUNT(*) FROM villages WHERE tile_id IS NULL OR tile_id NOT IN (SELECT id FROM tiles);',
      schema: z.number(),
    });
    expect(invalidVillages).toBe(0);
  });

  test('no two villages are on the same tile', () => {
    const duplicateTiles = database.selectValue({
      sql: 'SELECT COUNT(*) FROM (SELECT tile_id FROM villages GROUP BY tile_id HAVING COUNT(*) > 1);',
      schema: z.number(),
    });
    expect(duplicateTiles).toBe(0);
  });
});
