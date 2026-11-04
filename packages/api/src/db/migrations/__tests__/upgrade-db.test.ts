import { expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/api/testing';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { encodeAppVersionToDatabaseUserVersion } from '@pillage-first/utils/version';
import { upgradeDb } from '../upgrade-db';

test('0.4.81 migrates saved trade routes and player ownership together', async () => {
  using database = await prepareTestDatabase();
  const villages = database.selectValues({
    sql: 'SELECT id FROM villages ORDER BY id LIMIT 2;',
    schema: z.number(),
  });
  database.execMulti({
    sql: [
      'CREATE TABLE old_quests (id INTEGER PRIMARY KEY, quest_id TEXT NOT NULL, completed_at INTEGER, collected_at INTEGER, village_id INTEGER);',
      'INSERT INTO old_quests SELECT id, quest_id, completed_at, collected_at, village_id FROM quests;',
      'DROP TABLE quests;',
      'ALTER TABLE old_quests RENAME TO quests;',
      'CREATE INDEX idx_quests_quest_id ON quests (quest_id);',
      'CREATE INDEX idx_quests_village_id_notnull ON quests(village_id) WHERE village_id IS NOT NULL;',
      'CREATE TABLE old_reputation (source_faction_id INTEGER, target_faction_id INTEGER, reputation INTEGER, PRIMARY KEY (source_faction_id, target_faction_id));',
      'INSERT INTO old_reputation SELECT p.faction_id, fr.target_faction_id, fr.reputation FROM faction_reputation fr JOIN players p ON p.id = fr.player_id;',
      'DROP TABLE faction_reputation;',
      'ALTER TABLE old_reputation RENAME TO faction_reputation;',
      'DROP TABLE trade_routes;',
      'DELETE FROM events;',
    ].join('\n'),
  });
  database.exec({
    sql: "INSERT INTO events (id, type, starts_at, duration, village_id, meta) VALUES (700, 'tradeRoute', 1000, 0, $origin, $meta);",
    bind: {
      $origin: villages[0],
      $meta: JSON.stringify({
        targetVillageId: villages[1],
        resources: { wood: 100, clay: 50, iron: 25, wheat: 10 },
        interval: 3_600_000,
      }),
    },
  });
  const countBefore = database.selectValue({
    sql: 'SELECT COUNT(*) FROM quests;',
    schema: z.number(),
  });
  upgradeDb(database, encodeAppVersionToDatabaseUserVersion('0.4.80'));
  expect(
    database.selectObject({
      sql: 'SELECT id, village_id, target_village_id, paused, starts_at, interval FROM trade_routes WHERE id = 700;',
      schema: z.strictObject({
        id: z.number(),
        village_id: z.number(),
        target_village_id: z.number(),
        paused: z.number(),
        starts_at: z.number(),
        interval: z.number(),
      }),
    }),
  ).toStrictEqual({
    id: 700,
    village_id: villages[0],
    target_village_id: villages[1],
    paused: 0,
    starts_at: 1000,
    interval: 3_600_000,
  });
  expect(
    database.selectValue({
      sql: 'SELECT meta FROM events WHERE id = 700;',
      schema: z.string(),
    }),
  ).toBe(JSON.stringify({ tradeRouteId: 700 }));
  expect(
    database.selectValue({
      sql: 'SELECT COUNT(*) FROM quests;',
      schema: z.number(),
    }),
  ).toBe(countBefore);
  expect(
    database.selectValue({
      sql: 'SELECT COUNT(*) FROM quests WHERE player_id IS NULL;',
      schema: z.number(),
    }),
  ).toBe(0);
  expect(
    database.selectValue({
      sql: 'SELECT COUNT(*) FROM faction_reputation WHERE player_id = $player_id;',
      bind: { $player_id: PLAYER_ID },
      schema: z.number(),
    }),
  ).toBe(8);
  expect(
    database.selectValue({ sql: 'PRAGMA user_version;', schema: z.number() }),
  ).toBe(encodeAppVersionToDatabaseUserVersion('0.4.81'));
});
