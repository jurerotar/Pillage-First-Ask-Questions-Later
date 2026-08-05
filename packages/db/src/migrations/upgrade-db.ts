import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { env } from '@pillage-first/utils/env';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { encodeAppVersionToDatabaseUserVersion } from '@pillage-first/utils/version';
import createReportsIndexes from '../indexes/reports-indexes.sql?raw';
import createTrapperCagesIndexes from '../indexes/trapper-cages-indexes.sql?raw';
import createBattleReportParticipantsTable from '../schemas/battle-report-participants-schema.sql?raw';
import createBattleReportUnitsTable from '../schemas/battle-report-units-schema.sql?raw';
import createBattleReportsTable from '../schemas/battle-reports-schema.sql?raw';
import createGatheringExpeditionReportUnitsTable from '../schemas/gathering-expedition-report-units-schema.sql?raw';
import createGatheringExpeditionReportsTable from '../schemas/gathering-expedition-reports-schema.sql?raw';
import createHeroAdventureReportsTable from '../schemas/hero-adventure-reports-schema.sql?raw';
import createScheduledBuildingConstructionCancellationHistoryTable from '../schemas/history-tables/scheduled-building-construction-cancellation-history-schema.sql?raw';
import createHuntingPartyReportUnitsTable from '../schemas/hunting-party-report-units-schema.sql?raw';
import createHuntingPartyReportsTable from '../schemas/hunting-party-reports-schema.sql?raw';
import createReportOutcomeIdsTable from '../schemas/lookup-tables/report-outcome-ids-schema.sql?raw';
import createReportTagIdsTable from '../schemas/lookup-tables/report-tag-ids-schema.sql?raw';
import createReportTypeIdsTable from '../schemas/lookup-tables/report-type-ids-schema.sql?raw';
import createMovementReportUnitsTable from '../schemas/movement-report-units-schema.sql?raw';
import createMovementReportsTable from '../schemas/movement-reports-schema.sql?raw';
import createReportTagsTable from '../schemas/report-tags-schema.sql?raw';
import createReportsTable from '../schemas/reports-schema.sql?raw';
import createScheduledBuildingUpgradesTable from '../schemas/scheduled-building-upgrades-schema.sql?raw';
import createScoutingReportAttackerUnitsTable from '../schemas/scouting-report-attacker-units-schema.sql?raw';
import createScoutingReportStructuresTable from '../schemas/scouting-report-structures-schema.sql?raw';
import createScoutingReportUnitsTable from '../schemas/scouting-report-units-schema.sql?raw';
import createScoutingReportsTable from '../schemas/scouting-reports-schema.sql?raw';
import createTradeReportsTable from '../schemas/trade-reports-schema.sql?raw';
import createTrapperCagesTable from '../schemas/trapper-cages-schema.sql?raw';
import { reportOutcomeIdsSeeder } from '../seeders/report-outcome-ids-seeder';
import { reportTagIdsSeeder } from '../seeders/report-tag-ids-seeder';
import { reportTypeIdsSeeder } from '../seeders/report-type-ids-seeder';
import { setupGlobalWriteTriggers } from '../triggers/global-write-triggers';
import createReportDeleteTriggers from '../triggers/report-delete-triggers.sql?raw';
import createReportRetentionTriggers from '../triggers/report-retention-triggers.sql?raw';
import { migrateTo } from './migrate-db';

const queuedTroopCountQuestThresholds = [
  10, 50, 100, 200, 500, 1000, 2000, 5000, 10_000, 20_000, 50_000, 100_000,
  150_000, 200_000, 300_000, 500_000, 750_000, 1_000_000,
];

// This function should only contain db upgrades between app's minor version bumps. At that point, these DB changes
// should already be part of the new schema, so contents of this function should be deleted
export const upgradeDb = (
  database: DbFacade,
  currentDatabaseVersion: number,
): void => {
  const targetDatabaseVersion = encodeAppVersionToDatabaseUserVersion(
    env.VERSION,
  );

  if (currentDatabaseVersion === targetDatabaseVersion) {
    return;
  }

  let databaseVersion = currentDatabaseVersion;

  const migrate = (
    targetVersion: string,
    onMigrate: (db: DbFacade) => void,
  ): void => {
    databaseVersion = migrateTo(
      targetVersion,
      database,
      onMigrate,
      databaseVersion,
    );
  };

  migrate('0.4.12', (db) => {
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

  migrate('0.4.19', (db) => {
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

  migrate('0.4.22', (db) => {
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

  migrate('0.4.25', (db) => {
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

  migrate('0.4.28', (db) => {
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
      db.exec({
        sql: 'PRAGMA foreign_keys = OFF;',
      });

      try {
        db.transaction((db) => {
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
        db.exec({
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

  migrate('0.4.32', (db) => {
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
            INSERT INTO
              quests (quest_id, completed_at, collected_at, village_id)
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
              (
                SELECT 1
                ) seed
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
            AND SUBSTR(quest_id, LENGTH('troopCount-') + 1) GLOB '[0-9]*';
        `,
      });
    });
  });

  migrate('0.4.33', (db) => {
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
            INSERT INTO
              quests (quest_id, completed_at, collected_at, village_id)
            VALUES
              ($new_quest_id, $completed_at, $collected_at, NULL);
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

  migrate('0.4.34', (db) => {
    db.exec({
      sql: `
        INSERT INTO
          troops (unit_id, amount, tile_id, source_tile_id)
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
                JOIN JSON_EACH(e.meta, '$.troops') troop
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

  migrate('0.4.36', (db) => {
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
        INSERT INTO
          gatherers_hut_expeditions (village_id, completed)
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

  migrate('0.4.39', (db) => {
    db.exec({
      sql: 'PRAGMA foreign_keys = OFF;',
    });

    try {
      db.transaction((tx) => {
        tx.exec({
          sql: `
          DELETE
          FROM
            effects
          WHERE
            source = 'oasis'
            AND EXISTS
            (
              SELECT
                1
              FROM
                villages
              WHERE
                villages.id = effects.village_id
                AND villages.player_id != $player_id
              );
        `,
          bind: {
            $player_id: PLAYER_ID,
          },
        });

        tx.exec({
          sql: `
          DELETE
          FROM
            effects
          WHERE
            source = 'oasis'
            AND type = 'base'
            AND scope = 'village'
            AND village_id IS NULL;
        `,
        });

        tx.exec({
          sql: `
          WITH
            resource_effects(resource, effect) AS (
              VALUES
                ('wood', 'woodProduction'),
                ('clay', 'clayProduction'),
                ('iron', 'ironProduction'),
                ('wheat', 'wheatProduction')
              ),

            oasis_production AS (
              SELECT
                tiles.tile_id,
                re.effect,
                CASE
                  WHEN MAX(o.bonus) = 50 THEN 80
                  WHEN MAX(o.bonus) = 25 THEN 40
                  ELSE 10
                  END AS value
              FROM
                (
                  SELECT DISTINCT tile_id
                  FROM
                    oasis
                  ) tiles
                  CROSS JOIN resource_effects re
                  LEFT JOIN oasis o ON o.tile_id = tiles.tile_id
                  AND o.resource = re.resource
              GROUP BY
                tiles.tile_id,
                re.effect
              )

          INSERT
          INTO
            effects (effect_id, value, type, scope, source, village_id, source_specifier)
          SELECT
            ei.id,
            op.value,
            'base',
            'village',
            'oasis',
            NULL,
            op.tile_id
          FROM
            oasis_production op
              JOIN effect_ids ei ON ei.effect = op.effect
          WHERE
            op.value > 0;
        `,
        });

        tx.exec({
          sql: `
          UPDATE effects
          SET
            scope = 'local'
          WHERE
            scope = 'village';
        `,
        });

        tx.exec({
          sql: `
          CREATE TABLE IF NOT EXISTS effect_type_ids
          (
            id INTEGER PRIMARY KEY,
            type TEXT NOT NULL UNIQUE
          );
        `,
        });

        tx.exec({
          sql: `
          INSERT OR IGNORE INTO
            effect_type_ids (id, type)
          VALUES
            (1, 'base'         ),
            (2, 'bonus'        ),
            (3, 'bonus-booster');
        `,
        });

        tx.exec({
          sql: `
          CREATE TABLE IF NOT EXISTS effect_scope_ids
          (
            id INTEGER PRIMARY KEY,
            scope TEXT NOT NULL UNIQUE
          );
        `,
        });

        tx.exec({
          sql: `
          INSERT OR IGNORE INTO
            effect_scope_ids (id, scope)
          VALUES
            (1, 'global'),
            (2, 'local' ),
            (3, 'server');
        `,
        });

        tx.exec({
          sql: `
          CREATE TABLE IF NOT EXISTS effect_source_ids
          (
            id INTEGER PRIMARY KEY,
            source TEXT NOT NULL UNIQUE
          );
        `,
        });

        tx.exec({
          sql: `
            INSERT OR IGNORE INTO
              effect_source_ids (id, source)
          VALUES
            (1, 'building'),
            (2, 'hero'    ),
            (3, 'oasis'   ),
            (4, 'artifact'),
            (5, 'tribe'   ),
            (6, 'server'  ),
            (7, 'troops'  );
        `,
        });

        tx.exec({
          sql: `
            CREATE TABLE IF NOT EXISTS resource_ids
            (
              id INTEGER PRIMARY KEY,
              resource TEXT NOT NULL UNIQUE
            );
          `,
        });

        tx.exec({
          sql: `
            INSERT OR IGNORE INTO
              resource_ids (id, resource)
            VALUES
              (1, 'wood' ),
              (2, 'clay' ),
              (3, 'iron' ),
              (4, 'wheat');
          `,
        });

        tx.exec({
          sql: `
            CREATE INDEX IF NOT EXISTS idx_resource_ids_resource ON resource_ids (resource);
          `,
        });

        tx.exec({
          sql: `
            CREATE TABLE IF NOT EXISTS tile_type_ids
            (
              id INTEGER PRIMARY KEY,
              type TEXT NOT NULL UNIQUE
            );
          `,
        });

        tx.exec({
          sql: `
            INSERT OR IGNORE INTO
              tile_type_ids (id, type)
            VALUES
              (1, 'free' ),
              (2, 'oasis');
          `,
        });

        tx.exec({
          sql: `
            CREATE INDEX IF NOT EXISTS idx_tile_type_ids_type ON tile_type_ids (type);
          `,
        });

        tx.exec({
          sql: `
            DROP INDEX IF EXISTS idx_tiles_rfc_id;
          `,
        });

        tx.exec({
          sql: `
            DROP INDEX IF EXISTS idx_tiles_type_xy;
          `,
        });

        tx.exec({
          sql: `
            CREATE TABLE tiles_new
            (
              id INTEGER PRIMARY KEY,
              x INTEGER NOT NULL,
              y INTEGER NOT NULL,
              type_id INTEGER NOT NULL,
              resource_field_composition_id INTEGER,
              oasis_graphics INTEGER,

              FOREIGN KEY (type_id) REFERENCES tile_type_ids (id),
              FOREIGN KEY (resource_field_composition_id) REFERENCES resource_field_composition_ids (id)
            );
          `,
        });

        tx.exec({
          sql: `
            INSERT INTO
              tiles_new (id, x, y, type_id, resource_field_composition_id, oasis_graphics)
            SELECT
              t.id,
              t.x,
              t.y,
              tti.id,
              t.resource_field_composition_id,
              t.oasis_graphics
            FROM
              tiles t
                JOIN tile_type_ids tti ON tti.type = t.type;
          `,
        });

        tx.exec({
          sql: `
            DROP TABLE tiles;
          `,
        });

        tx.exec({
          sql: `
            ALTER TABLE tiles_new
              RENAME TO tiles;
          `,
        });

        tx.exec({
          sql: `
            CREATE INDEX idx_tiles_rfc_id ON tiles (resource_field_composition_id);
          `,
        });

        tx.exec({
          sql: `
            CREATE INDEX idx_tiles_type_xy ON tiles (type_id, x, y);
          `,
        });

        tx.exec({
          sql: `
            DROP INDEX IF EXISTS idx_oasis_tile_id;
          `,
        });

        tx.exec({
          sql: `
            DROP INDEX IF EXISTS idx_oasis_village_id;
          `,
        });

        tx.exec({
          sql: `
            DROP INDEX IF EXISTS idx_oasis_resource_bonus;
          `,
        });

        tx.exec({
          sql: `
            CREATE TABLE oasis_new
            (
              id INTEGER PRIMARY KEY,
              tile_id INTEGER NOT NULL,
              village_id INTEGER,
              resource_id INTEGER NOT NULL,
              bonus INTEGER NOT NULL,

              FOREIGN KEY (tile_id) REFERENCES tiles (id) ON DELETE CASCADE,
              FOREIGN KEY (village_id) REFERENCES villages (id) ON DELETE CASCADE,
              FOREIGN KEY (resource_id) REFERENCES resource_ids (id)
            );
          `,
        });

        tx.exec({
          sql: `
            INSERT INTO
              oasis_new (id, tile_id, village_id, resource_id, bonus)
            SELECT
              o.id,
              o.tile_id,
              o.village_id,
              ri.id,
              o.bonus
            FROM
              oasis o
                JOIN resource_ids ri ON ri.resource = o.resource;
          `,
        });

        tx.exec({
          sql: `
            DROP TABLE oasis;
          `,
        });

        tx.exec({
          sql: `
            ALTER TABLE oasis_new
              RENAME TO oasis;
          `,
        });

        tx.exec({
          sql: `
            CREATE INDEX idx_oasis_tile_id ON oasis (tile_id);
          `,
        });

        tx.exec({
          sql: `
            CREATE INDEX idx_oasis_village_id ON oasis (village_id);
          `,
        });

        tx.exec({
          sql: `
            CREATE INDEX idx_oasis_resource_bonus ON oasis (resource_id, bonus);
          `,
        });

        tx.exec({
          sql: `
          DROP INDEX IF EXISTS idx_effects_effect_id;
        `,
        });

        tx.exec({
          sql: `
          DROP INDEX IF EXISTS idx_effects_village_id;
        `,
        });

        tx.exec({
          sql: `
          DROP INDEX IF EXISTS idx_effects_village_effect_scope_spec;
        `,
        });

        tx.exec({
          sql: `
          DROP INDEX IF EXISTS idx_effects_wheat_effect_village_value;
        `,
        });

        tx.exec({
          sql: `
          CREATE TABLE effects_new
          (
            id INTEGER PRIMARY KEY,
            effect_id INTEGER NOT NULL,
            value REAL NOT NULL,
            type_id INTEGER NOT NULL,
            scope_id INTEGER NOT NULL,
            source_id INTEGER NOT NULL,
            village_id INTEGER,
            source_specifier INTEGER,

            FOREIGN KEY (effect_id) REFERENCES effect_ids (id),
            FOREIGN KEY (type_id) REFERENCES effect_type_ids (id),
            FOREIGN KEY (scope_id) REFERENCES effect_scope_ids (id),
            FOREIGN KEY (source_id) REFERENCES effect_source_ids (id),
            FOREIGN KEY (village_id) REFERENCES villages (id) ON DELETE CASCADE ON UPDATE CASCADE
          );
        `,
        });

        tx.exec({
          sql: `
          INSERT INTO
            effects_new (id, effect_id, value, type_id, scope_id, source_id, village_id, source_specifier)
          SELECT
            e.id,
            e.effect_id,
            e.value,
            et.id,
            esc.id,
            eso.id,
            e.village_id,
            e.source_specifier
          FROM
            effects e
              JOIN effect_type_ids et ON et.type = e.type
              JOIN effect_scope_ids esc ON esc.scope = e.scope
              JOIN effect_source_ids eso ON eso.source = e.source;
        `,
        });

        tx.exec({
          sql: `
          DROP TABLE effects;
        `,
        });

        tx.exec({
          sql: `
          ALTER TABLE effects_new
            RENAME TO effects;
        `,
        });

        tx.exec({
          sql: `
          CREATE INDEX idx_effects_effect_id ON effects (effect_id);
        `,
        });

        tx.exec({
          sql: `
          CREATE INDEX idx_effects_village_id ON effects (village_id);
        `,
        });

        tx.exec({
          sql: `
          CREATE INDEX idx_effects_village_effect_scope_spec
            ON effects (effect_id, village_id, scope_id, source_specifier);
        `,
        });

        tx.exec({
          sql: `
        -- SQLite partial-index predicates cannot contain subqueries. scope_id = 2 is the stable id for 'local'.
        CREATE INDEX IF NOT EXISTS idx_effects_wheat_effect_village_value
          ON effects(effect_id, village_id, value)
          WHERE scope_id = 2 AND source_specifier = 0 AND effect_id = 1;
      `,
        });
      });
    } finally {
      db.exec({
        sql: 'PRAGMA foreign_keys = ON;',
      });
    }
  });

  migrate('0.4.40', (db) => {
    try {
      db.exec({ sql: createTrapperCagesTable });
      db.exec({ sql: createTrapperCagesIndexes });
    } catch {
      // Table already exists on newer databases.
    }

    setupGlobalWriteTriggers(db);
  });

  migrate('0.4.45', (db) => {
    db.exec({ sql: createReportOutcomeIdsTable });
    reportOutcomeIdsSeeder(db);

    db.exec({ sql: createReportTagIdsTable });
    reportTagIdsSeeder(db);

    db.exec({ sql: createReportTypeIdsTable });
    reportTypeIdsSeeder(db);

    db.exec({ sql: createReportsTable });
    db.exec({ sql: createHeroAdventureReportsTable });
    db.exec({ sql: createMovementReportsTable });
    db.exec({ sql: createMovementReportUnitsTable });
    db.exec({ sql: createTradeReportsTable });
    db.exec({ sql: createHuntingPartyReportsTable });
    db.exec({ sql: createHuntingPartyReportUnitsTable });
    db.exec({ sql: createGatheringExpeditionReportsTable });
    db.exec({ sql: createGatheringExpeditionReportUnitsTable });
    db.exec({ sql: createReportTagsTable });
    db.exec({ sql: createBattleReportsTable });
    db.exec({ sql: createBattleReportParticipantsTable });
    db.exec({ sql: createBattleReportUnitsTable });
    db.exec({ sql: createScoutingReportsTable });
    db.exec({ sql: createScoutingReportAttackerUnitsTable });
    db.exec({ sql: createScoutingReportUnitsTable });
    db.exec({ sql: createScoutingReportStructuresTable });

    db.exec({ sql: createReportsIndexes });
    db.exec({ sql: createReportDeleteTriggers });
    setupGlobalWriteTriggers(db);
  });

  migrate('0.4.47', (db) => {
    db.exec({ sql: createReportRetentionTriggers });
  });

  migrate('0.4.49', (db) => {
    db.exec({ sql: createScheduledBuildingUpgradesTable });

    db.exec({
      sql: createScheduledBuildingConstructionCancellationHistoryTable,
    });
  });

  migrate('0.4.50', (db) => {
    db.exec({
      sql: `
        UPDATE events
        SET
          meta = JSON_REMOVE(meta, '$.merchantAmount')
        WHERE
          type = 'tradeRoute'
          AND meta IS NOT NULL
          AND JSON_TYPE(meta, '$.merchantAmount') IS NOT NULL;
      `,
    });
  });

  migrate('0.4.51', (db) => {
    db.transaction((tx) => {
      tx.exec({
        sql: `
          UPDATE effects
          SET
            value =
              CASE bf.level
                WHEN 0 THEN 0
                WHEN 1 THEN 100
                WHEN 2 THEN 130
                WHEN 3 THEN 170
                WHEN 4 THEN 220
                WHEN 5 THEN 280
                WHEN 6 THEN 360
                WHEN 7 THEN 460
                WHEN 8 THEN 600
                WHEN 9 THEN 770
                WHEN 10 THEN 1000
                END
              *
              CASE
                WHEN ti.tribe = 'gauls' THEN 2
                ELSE 1
                END
          FROM
            building_fields bf
              JOIN building_ids bi ON bi.id = bf.building_id
              JOIN villages v ON v.id = bf.village_id
              JOIN players p ON p.id = v.player_id
              JOIN tribe_ids ti ON ti.id = p.tribe_id
          WHERE
            effects.village_id = bf.village_id
            AND effects.source_specifier = bf.field_id
            AND bi.building = 'CRANNY'
            AND effects.effect_id = (
              SELECT id FROM effect_ids WHERE effect = 'crannyCapacity'
            )
            AND effects.type_id = (
              SELECT id FROM effect_type_ids WHERE type = 'base'
            )
            AND effects.scope_id = (
              SELECT id FROM effect_scope_ids WHERE scope = 'local'
            )
            AND effects.source_id = (
              SELECT id FROM effect_source_ids WHERE source = 'building'
            );
        `,
      });

      tx.exec({
        sql: `
          UPDATE effects
          SET
            value = ROUND(
              1 + bf.level *
              CASE
                WHEN ti.tribe = 'romans' THEN 0.2
                ELSE 0.1
                END,
              4
            )
          FROM
            building_fields bf
              JOIN building_ids bi ON bi.id = bf.building_id
              JOIN villages v ON v.id = bf.village_id
              JOIN players p ON p.id = v.player_id
              JOIN tribe_ids ti ON ti.id = p.tribe_id
          WHERE
            effects.village_id = bf.village_id
            AND effects.source_specifier = bf.field_id
            AND bi.building = 'TRADE_OFFICE'
            AND effects.effect_id = (
              SELECT id FROM effect_ids WHERE effect = 'merchantCapacity'
            )
            AND effects.type_id = (
              SELECT id FROM effect_type_ids WHERE type = 'bonus'
            )
            AND effects.scope_id = (
              SELECT id FROM effect_scope_ids WHERE scope = 'local'
            )
            AND effects.source_id = (
              SELECT id FROM effect_source_ids WHERE source = 'building'
            );
        `,
      });
    });
  });

  // If all migrations passed, bump it to current version
  if (databaseVersion !== targetDatabaseVersion) {
    database.exec({
      sql: `PRAGMA user_version=${targetDatabaseVersion};`,
    });
  }
};
