import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { env } from '@pillage-first/utils/env';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { encodeAppVersionToDatabaseUserVersion } from '@pillage-first/utils/version';
import createTrapperCagesIndexes from '../indexes/trapper-cages-indexes.sql?raw';
import createTrapperCagesTable from '../schemas/trapper-cages-schema.sql?raw';
import { setupGlobalWriteTriggers } from '../triggers/global-write-triggers';
import { migrateTo } from './migrate-db';

const queuedTroopCountQuestThresholds = [
  10, 50, 100, 200, 500, 1000, 2000, 5000, 10_000, 20_000, 50_000, 100_000,
  150_000, 200_000, 300_000, 500_000, 750_000, 1_000_000,
];

// This function should only contain db upgrades between app's minor version bumps. At that point, these DB changes
// should already be part of the new schema, so contents of this function should be deleted
export const upgradeDb = (database: DbFacade): void => {
  migrateTo('0.4.12', database, (db) => {
    db.exec({
      sql: `
        CREATE TRIGGER IF NOT EXISTS loyalties_delete_capped_entries_after_update
        AFTER UPDATE OF loyalty
        ON loyalties
        WHEN NEW.loyalty >= 100
        BEGIN
          DELETE FROM loyalties WHERE tile_id = NEW.tile_id;
        END;
      `,
    });
  });

  migrateTo('0.4.19', database, (db) => {
    // Normalize legacy village_founding_history timestamps from milliseconds to seconds
    // Some historical rows were inserted by JS in milliseconds. Since triggers now set
    // timestamps via unixepoch() (seconds), convert any ms values at rest.
    db.exec({
      sql: `
        UPDATE village_founding_history
        SET
          timestamp =
            CASE
              WHEN timestamp > 2000000000 THEN CAST(timestamp / 1000 AS INTEGER)
              ELSE timestamp
              END
        WHERE
          timestamp > 2000000000;
      `,
    });
  });

  migrateTo('0.4.22', database, (db) => {
    try {
      db.exec({
        sql: `
          ALTER TABLE hero_adventures
            ADD COLUMN last_updated_at INTEGER NOT NULL DEFAULT 0;
        `,
      });
    } catch {
      // Column already exists on newer databases.
    }

    db.exec({
      sql: `
        UPDATE hero_adventures
        SET
          last_updated_at = COALESCE(
            (
              SELECT resolves_at
              FROM
                events
              WHERE
                type = 'adventurePointIncrease'
              LIMIT 1
              ),
            (
              SELECT last_write
              FROM
                meta
              LIMIT 1
              ),
            last_updated_at
                            )
        WHERE
          last_updated_at = 0;
      `,
    });

    db.exec({
      sql: `
        DELETE
        FROM
          events
        WHERE
          type = 'adventurePointIncrease';
      `,
    });
  });

  migrateTo('0.4.25', database, (db) => {
    try {
      db.exec({
        sql: `
          ALTER TABLE map_markers
            ADD COLUMN description TEXT NOT NULL DEFAULT '';
        `,
      });
    } catch {
      // Column already exists on newer databases.
    }

    try {
      db.exec({
        sql: `
          ALTER TABLE map_markers
            ADD COLUMN color TEXT NOT NULL DEFAULT '#dc2626';
        `,
      });
    } catch {
      // Column already exists on newer databases.
    }
  });

  migrateTo('0.4.28', database, (db) => {
    const newBuildingIdsCount = db.selectValue({
      sql: `
      SELECT COUNT(*)
      FROM
        building_ids
      WHERE
        building IN ('GATHERERS_HUT', 'HUNTERS_LODGE');
    `,
      schema: z.number(),
    })!;

    const shouldRecreateBuildingIds = newBuildingIdsCount !== 2;

    if (shouldRecreateBuildingIds) {
      database.exec({
        sql: 'PRAGMA foreign_keys = OFF;',
      });

      try {
        database.transaction((db) => {
          db.exec({
            sql: 'DROP TABLE IF EXISTS building_ids;',
          });

          db.exec({
            sql: `
              CREATE TABLE building_ids
              (
                id INTEGER PRIMARY KEY,
                building TEXT NOT NULL UNIQUE CHECK (
                  building IN
                  ('BARRACKS', 'GREAT_BARRACKS', 'STABLE', 'GREAT_STABLE', 'WORKSHOP',
                   'HOSPITAL', 'CLAY_PIT', 'WHEAT_FIELD', 'WOODCUTTER', 'IRON_MINE',
                   'BAKERY', 'BRICKYARD', 'GRAIN_MILL', 'GRANARY', 'GREAT_GRANARY',
                   'IRON_FOUNDRY', 'SAWMILL', 'WAREHOUSE', 'GREAT_WAREHOUSE',
                   'WATERWORKS', 'ACADEMY', 'ROMAN_WALL', 'TEUTONIC_WALL',
                   'HEROS_MANSION', 'HUN_WALL', 'GAUL_WALL', 'RALLY_POINT',
                   'EGYPTIAN_WALL', 'TRAPPER', 'BREWERY', 'COMMAND_CENTER', 'CRANNY',
                   'HORSE_DRINKING_TROUGH', 'MAIN_BUILDING', 'MARKETPLACE',
                   'RESIDENCE', 'TOURNAMENT_SQUARE', 'TRADE_OFFICE', 'SMITHY',
                   'TOWN_HALL', 'EMBASSY', 'TREASURY', 'GATHERERS_HUT',
                   'HUNTERS_LODGE', 'SPARTAN_WALL', 'NATAR_WALL', 'NATURE_WALL'))
              ) STRICT;
            `,
          });

          db.exec({
            sql: `
            INSERT INTO
              building_ids (id, building)
            VALUES
              (1,  'BARRACKS'             ),
              (2,  'GREAT_BARRACKS'       ),
              (3,  'STABLE'               ),
              (4,  'GREAT_STABLE'         ),
              (5,  'WORKSHOP'             ),
              (6,  'HOSPITAL'             ),
              (7,  'CLAY_PIT'             ),
              (8,  'WHEAT_FIELD'          ),
              (9,  'WOODCUTTER'           ),
              (10, 'IRON_MINE'            ),
              (11, 'BAKERY'               ),
              (12, 'BRICKYARD'            ),
              (13, 'GRAIN_MILL'           ),
              (14, 'GRANARY'              ),
              (15, 'GREAT_GRANARY'        ),
              (16, 'IRON_FOUNDRY'         ),
              (17, 'SAWMILL'              ),
              (18, 'WAREHOUSE'            ),
              (19, 'GREAT_WAREHOUSE'      ),
              (20, 'WATERWORKS'           ),
              (21, 'ACADEMY'              ),
              (22, 'ROMAN_WALL'           ),
              (23, 'SPARTAN_WALL'         ),
              (24, 'TEUTONIC_WALL'        ),
              (25, 'HEROS_MANSION'        ),
              (26, 'HUN_WALL'             ),
              (27, 'GAUL_WALL'            ),
              (28, 'RALLY_POINT'          ),
              (29, 'EGYPTIAN_WALL'        ),
              (30, 'NATURE_WALL'          ),
              (31, 'NATAR_WALL'           ),
              (32, 'TRAPPER'              ),
              (33, 'BREWERY'              ),
              (34, 'COMMAND_CENTER'       ),
              (35, 'CRANNY'               ),
              (36, 'HORSE_DRINKING_TROUGH'),
              (37, 'MAIN_BUILDING'        ),
              (38, 'MARKETPLACE'          ),
              (39, 'RESIDENCE'            ),
              (40, 'TOURNAMENT_SQUARE'    ),
              (41, 'TRADE_OFFICE'         ),
              (42, 'SMITHY'               ),
              (43, 'TOWN_HALL'            ),
              (44, 'EMBASSY'              ),
              (45, 'TREASURY'             ),
              (46, 'GATHERERS_HUT'        ),
              (47, 'HUNTERS_LODGE'        );
          `,
          });

          db.exec({
            sql: `
            CREATE INDEX idx_building_ids_building ON building_ids (building);
          `,
          });
        });
      } finally {
        database.exec({
          sql: 'PRAGMA foreign_keys = ON;',
        });
      }
    }

    db.exec({
      sql: `
      INSERT OR IGNORE INTO
        bookmarks (village_id, building_id, tab_name)
      SELECT
        villages.id,
        building_ids.id,
        'default'
      FROM
        villages
          CROSS JOIN building_ids
      WHERE
        villages.player_id = $player_id
        AND building_ids.building IN ('GATHERERS_HUT', 'HUNTERS_LODGE');
    `,
      bind: { $player_id: PLAYER_ID },
    });

    try {
      db.exec({
        sql: `
          ALTER TABLE developer_settings
            ADD COLUMN is_free_hunting_parties_enabled INTEGER NOT NULL DEFAULT 0 CHECK (is_free_hunting_parties_enabled IN (0, 1));
        `,
      });
    } catch {
      // Column already exists on newer databases.
    }
  });

  migrateTo('0.4.32', database, (db) => {
    const queuedTroopCount =
      db.selectValue({
        sql: `
          SELECT
            (
              SELECT COALESCE(SUM(uth.amount), 0)
              FROM
                unit_training_history uth
                JOIN villages v ON uth.village_id = v.id
              WHERE
                v.player_id = $player_id
            )
            +
            (
              SELECT COUNT(*)
              FROM
                events e
                JOIN villages v ON e.village_id = v.id
              WHERE
                e.type = 'troopTraining'
                AND v.player_id = $player_id
            ) AS queued_troop_count;
        `,
        bind: { $player_id: PLAYER_ID },
        schema: z.number(),
      }) ?? 0;

    const completedAt = Date.now();

    db.transaction((tx) => {
      for (const threshold of queuedTroopCountQuestThresholds) {
        tx.exec({
          sql: `
            INSERT INTO quests (quest_id, completed_at, collected_at, village_id)
            SELECT
              $new_quest_id,
              CASE
                WHEN old.completed_at IS NOT NULL THEN old.completed_at
                WHEN $queued_troop_count >= $threshold THEN $completed_at
                ELSE NULL
              END,
              CASE
                WHEN old.completed_at IS NOT NULL THEN old.collected_at
                ELSE NULL
              END,
              NULL
            FROM
              (SELECT 1) seed
                LEFT JOIN quests old ON old.quest_id = $old_quest_id
                  AND old.village_id IS NULL;
          `,
          bind: {
            $new_quest_id: `queuedTroopCount-${threshold}`,
            $old_quest_id: `troopCount-${threshold}`,
            $queued_troop_count: queuedTroopCount,
            $threshold: threshold,
            $completed_at: completedAt,
          },
        });
      }

      tx.exec({
        sql: `
          DELETE
          FROM
            quests
          WHERE
            village_id IS NULL
            AND quest_id LIKE 'troopCount-%'
            AND substr(quest_id, length('troopCount-') + 1) GLOB '[0-9]*';
        `,
      });
    });
  });

  migrateTo('0.4.33', database, (db) => {
    const legacyQuests = db.selectObjects({
      sql: `
        SELECT quest_id, completed_at, collected_at
        FROM
          quests
        WHERE
          village_id IS NULL
          AND quest_id LIKE 'unitTroopCount-%';
      `,
      schema: z.strictObject({
        quest_id: z.string(),
        completed_at: z.number().nullable(),
        collected_at: z.number().nullable(),
      }),
    });

    const completedAt = Date.now();

    db.transaction((tx) => {
      for (const legacyQuest of legacyQuests) {
        const [, unitId, thresholdText] = legacyQuest.quest_id.split('-');
        const threshold = Number.parseInt(thresholdText, 10);

        if (!unitId || !Number.isInteger(threshold)) {
          continue;
        }

        const queuedTroopCountById =
          tx.selectValue({
            sql: `
              SELECT
                (
                  SELECT COALESCE(SUM(uth.amount), 0)
                  FROM
                    unit_training_history uth
                    JOIN unit_ids ui ON uth.unit_id = ui.id
                    JOIN villages v ON uth.village_id = v.id
                  WHERE
                    v.player_id = $player_id
                    AND ui.unit = $unit_id
                )
                +
                (
                  SELECT COUNT(*)
                  FROM
                    events e
                    JOIN villages v ON e.village_id = v.id
                  WHERE
                    e.type = 'troopTraining'
                    AND v.player_id = $player_id
                    AND JSON_EXTRACT(e.meta, '$.unitId') = $unit_id
                ) AS queued_troop_count_by_id;
            `,
            bind: {
              $player_id: PLAYER_ID,
              $unit_id: unitId,
            },
            schema: z.number(),
          }) ?? 0;

        tx.exec({
          sql: `
            INSERT INTO quests (quest_id, completed_at, collected_at, village_id)
            VALUES (
              $new_quest_id,
              $completed_at,
              $collected_at,
              NULL
            );
          `,
          bind: {
            $new_quest_id: `queuedTroopCountById-${unitId}-${threshold}`,
            $completed_at:
              legacyQuest.completed_at ??
              (queuedTroopCountById >= threshold ? completedAt : null),
            $collected_at:
              legacyQuest.completed_at !== null
                ? legacyQuest.collected_at
                : null,
          },
        });
      }

      tx.exec({
        sql: `
          DELETE
          FROM
            quests
          WHERE
            village_id IS NULL
            AND quest_id LIKE 'unitTroopCount-%';
        `,
      });
    });
  });

  migrateTo('0.4.34', database, (db) => {
    db.exec({
      sql: `
        INSERT INTO troops (unit_id, amount, tile_id, source_tile_id)
        SELECT
          ui.id,
          1,
          v.tile_id,
          v.tile_id
        FROM
          heroes h
            JOIN villages v ON v.id = h.village_id
            JOIN unit_ids ui ON ui.unit = 'HERO'
        WHERE
          h.health > 0
          AND NOT EXISTS
          (
            SELECT 1
            FROM
              troops t
                JOIN unit_ids tui ON tui.id = t.unit_id
            WHERE
              tui.unit = 'HERO'
          )
          AND NOT EXISTS
          (
            SELECT 1
            FROM
              events e
                JOIN json_each(e.meta, '$.troops') troop
            WHERE
              e.type IN (
                'troopMovementReinforcements',
                'troopMovementRelocation',
                'troopMovementReturn',
                'troopMovementFindNewVillage',
                'troopMovementAttack',
                'troopMovementRaid',
                'troopMovementOasisOccupation',
                'troopMovementAdventure'
              )
              AND JSON_EXTRACT(troop.value, '$.unitId') = 'HERO'
          )
        ON CONFLICT(unit_id, tile_id, source_tile_id) DO NOTHING;
      `,
    });
  });

  migrateTo('0.4.36', database, (db) => {
    db.exec({
      sql: `
        CREATE TABLE IF NOT EXISTS gatherers_hut_expeditions
        (
          village_id INTEGER PRIMARY KEY,
          completed INTEGER NOT NULL DEFAULT 0 CHECK (completed >= 0),

          FOREIGN KEY (village_id) REFERENCES villages (id)
            ON DELETE CASCADE
            ON UPDATE CASCADE
        ) STRICT;
      `,
    });

    db.exec({
      sql: `
        INSERT INTO gatherers_hut_expeditions (village_id, completed)
        SELECT id, 0
        FROM
          villages
        WHERE
          player_id = $player_id
        ON CONFLICT(village_id) DO NOTHING;
      `,
      bind: {
        $player_id: PLAYER_ID,
      },
    });
  });

  migrateTo('0.4.37', database, (db) => {
    try {
      db.exec({ sql: createTrapperCagesTable });
      db.exec({ sql: createTrapperCagesIndexes });
    } catch {
      // Table already exists on newer databases.
    }

    setupGlobalWriteTriggers(db);
  });

  // If all migrations passed, bump it to current version
  database.exec({
    sql: `PRAGMA user_version=${encodeAppVersionToDatabaseUserVersion(env.VERSION)};`,
  });
};
