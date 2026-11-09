import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { prepareTestDatabase } from '../../testing';

describe('oasisSeeder', () => {
  test('oasis rows only exist for tiles with type = "oasis"', async () => {
    using database = await prepareTestDatabase();

    const countForNonOasis = database.selectValue({
      sql: `
        SELECT COUNT(*) AS c
        FROM
          oasis o
            JOIN tiles t ON o.tile_id = t.id
        WHERE
          t.type_id != (SELECT id FROM tile_type_ids WHERE type = 'oasis');
      `,
      schema: z.number(),
    });

    expect(countForNonOasis).toBe(0);
  });

  test('oasis bonus values are only 25 or 50 and resource strings are lowercase', async () => {
    using database = await prepareTestDatabase();

    const invalidRows = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM
          oasis o
            JOIN resource_ids ri ON ri.id = o.resource_id
        WHERE
          o.bonus NOT IN (25, 50)
          OR ri.resource != LOWER(ri.resource);
      `,
      schema: z.number(),
    });

    expect(invalidRows).toBe(0);
  });

  test('there is at least one oasis that has BOTH its resource bonus and a separate wheat bonus (composite)', async () => {
    using database = await prepareTestDatabase();

    const count = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM
          oasis o
            JOIN resource_ids ri ON ri.id = o.resource_id
        GROUP BY
          tile_id
        HAVING
          SUM(CASE WHEN ri.resource = 'wheat' THEN 1 ELSE 0 END) >= 1
          AND SUM(CASE WHEN ri.resource != 'wheat' THEN 1 ELSE 0 END) >= 1;
      `,
      schema: z.number(),
    });

    expect(count).toBeGreaterThan(0);
  });

  test('there is at least one oasis that has a resource bonus WITHOUT any wheat bonus (resource-only)', async () => {
    using database = await prepareTestDatabase();

    const count = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM
          oasis o
            JOIN resource_ids ri ON ri.id = o.resource_id
        GROUP BY
          tile_id
        HAVING
          SUM(CASE WHEN ri.resource = 'wheat' THEN 1 ELSE 0 END) = 0
          AND SUM(CASE WHEN ri.resource != 'wheat' THEN 1 ELSE 0 END) >= 1;
      `,
      schema: z.number(),
    });

    expect(count).toBeGreaterThan(0);
  });

  test('there is at least one oasis that has a 50% bonus', async () => {
    using database = await prepareTestDatabase();

    const count = database.selectValue({
      sql: 'SELECT COUNT(*) FROM oasis WHERE bonus = 50;',
      schema: z.number(),
    });

    expect(count).toBeGreaterThan(0);
  });

  test('some oases are occupied by villages', async () => {
    using database = await prepareTestDatabase();

    const occupiedCount = database.selectValue({
      sql: 'SELECT COUNT(*) FROM oasis WHERE village_id IS NOT NULL;',
      schema: z.number(),
    });

    expect(occupiedCount).toBeGreaterThan(0);
  });

  test('occupied oasis count does not exceed hero mansion slots', async () => {
    using database = await prepareTestDatabase();

    const invalidVillageCount = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM (
          SELECT
            v.id,
            COUNT(DISTINCT o.tile_id) AS occupied_oasis,
            CASE
              WHEN COALESCE(MAX(bf.level), 0) >= 20 THEN 3
              WHEN COALESCE(MAX(bf.level), 0) >= 15 THEN 2
              WHEN COALESCE(MAX(bf.level), 0) >= 10 THEN 1
              ELSE 0
            END AS oasis_slots
          FROM
            villages v
              LEFT JOIN oasis o ON o.village_id = v.id
              LEFT JOIN building_fields bf
                ON bf.village_id = v.id
                AND bf.building_id = (SELECT id FROM building_ids WHERE building = 'HEROS_MANSION')
          GROUP BY
            v.id
          HAVING
            occupied_oasis > oasis_slots
        );
      `,
      schema: z.number(),
    });

    expect(invalidVillageCount).toBe(0);
  });

  test('villages without level 10 hero mansion do not occupy oasis', async () => {
    using database = await prepareTestDatabase();

    const invalidVillageCount = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM (
          SELECT
            v.id,
            COUNT(DISTINCT o.tile_id) AS occupied_oasis,
            COALESCE(MAX(bf.level), 0) AS hero_mansion_level
          FROM
            villages v
              JOIN oasis o ON o.village_id = v.id
              LEFT JOIN building_fields bf
                ON bf.village_id = v.id
                AND bf.building_id = (SELECT id FROM building_ids WHERE building = 'HEROS_MANSION')
          GROUP BY
            v.id
          HAVING
            occupied_oasis > 0
            AND hero_mansion_level < 10
        );
      `,
      schema: z.number(),
    });

    expect(invalidVillageCount).toBe(0);
  });

  test('npc villages can occupy multiple oasis when hero mansion level allows it', async () => {
    using database = await prepareTestDatabase();

    const multiOasisVillageCount = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM (
          SELECT
            v.id,
            COUNT(DISTINCT o.tile_id) AS occupied_oasis,
            COALESCE(MAX(bf.level), 0) AS hero_mansion_level
          FROM
            villages v
              JOIN oasis o ON o.village_id = v.id
              JOIN building_fields bf
                ON bf.village_id = v.id
                AND bf.building_id = (SELECT id FROM building_ids WHERE building = 'HEROS_MANSION')
          WHERE
            v.player_id != $player_id
          GROUP BY
            v.id
          HAVING
            occupied_oasis > 1
            AND hero_mansion_level >= 15
        );
      `,
      bind: { $player_id: PLAYER_ID },
      schema: z.number(),
    });

    expect(multiOasisVillageCount).toBeGreaterThan(0);
  });

  test('every oasis has at least one bonus record', async () => {
    using database = await prepareTestDatabase();

    const oasesWithoutBonus = database.selectValue({
      sql: `
        SELECT COUNT(DISTINCT t.id)
        FROM tiles t
        WHERE t.type_id = (SELECT id FROM tile_type_ids WHERE type = 'oasis') AND NOT EXISTS (SELECT 1 FROM oasis o WHERE o.tile_id = t.id);
      `,
      schema: z.number(),
    });

    expect(oasesWithoutBonus).toBe(0);
  });
});
