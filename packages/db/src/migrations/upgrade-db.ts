import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { env } from '@pillage-first/utils/env';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { encodeAppVersionToDatabaseUserVersion } from '@pillage-first/utils/version';
import createTrapperCagesIndexes from '../indexes/trapper-cages-indexes.sql?raw';
import createWoundedTroopsIndexes from '../indexes/wounded-troops-indexes.sql?raw';
import createBattleReportBuildingsTable from '../schemas/battle-report-buildings-schema.sql?raw';
import createBattleReportParticipantsTable from '../schemas/battle-report-participants-schema.sql?raw';
import createBattleReportUnitsTable from '../schemas/battle-report-units-schema.sql?raw';
import createBattleReportsTable from '../schemas/battle-reports-schema.sql?raw';
import createGatheringExpeditionReportUnitsTable from '../schemas/gathering-expedition-report-units-schema.sql?raw';
import createGatheringExpeditionReportsTable from '../schemas/gathering-expedition-reports-schema.sql?raw';
import createHeroAdventureReportsTable from '../schemas/hero-adventure-reports-schema.sql?raw';
import createScheduledBuildingConstructionCancellationHistoryTable from '../schemas/history-tables/scheduled-building-construction-cancellation-history-schema.sql?raw';
import createHuntingPartyReportUnitsTable from '../schemas/hunting-party-report-units-schema.sql?raw';
import createHuntingPartyReportsTable from '../schemas/hunting-party-reports-schema.sql?raw';
import createBuildingIdsTable from '../schemas/lookup-tables/building-ids-schema.sql?raw';
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
import createWoundedTroopsTable from '../schemas/wounded-troops-schema.sql?raw';
import { buildingIdsSeeder } from '../seeders/building-ids-seeder';
import { reportOutcomeIdsSeeder } from '../seeders/report-outcome-ids-seeder';
import { reportTagIdsSeeder } from '../seeders/report-tag-ids-seeder';
import { reportTypeIdsSeeder } from '../seeders/report-type-ids-seeder';
import createBattleReportWoundedTroopsTriggers from '../triggers/battle-report-wounded-troops-triggers.sql?raw';
import { setupGlobalWriteTriggers } from '../triggers/global-write-triggers';
import { setupHistoryTriggers } from '../triggers/history-triggers';
import createReportDeleteTriggers from '../triggers/report-delete-triggers.sql?raw';
import createReportRetentionTriggers from '../triggers/report-retention-triggers.sql?raw';
import { migrateTo } from './migrate-db';

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
              SELECT id
              FROM effect_ids
              WHERE effect = 'crannyCapacity'
              )
            AND effects.type_id = (
              SELECT id
              FROM effect_type_ids
              WHERE type = 'base'
              )
            AND effects.scope_id = (
              SELECT id
              FROM effect_scope_ids
              WHERE scope = 'local'
              )
            AND effects.source_id = (
              SELECT id
              FROM effect_source_ids
              WHERE source = 'building'
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
              SELECT id
              FROM effect_ids
              WHERE effect = 'merchantCapacity'
              )
            AND effects.type_id = (
              SELECT id
              FROM effect_type_ids
              WHERE type = 'bonus'
              )
            AND effects.scope_id = (
              SELECT id
              FROM effect_scope_ids
              WHERE scope = 'local'
              )
            AND effects.source_id = (
              SELECT id
              FROM effect_source_ids
              WHERE source = 'building'
              );
        `,
      });
    });
  });

  migrate('0.4.52', (db) => {
    const tableExists = (tableName: string): boolean => {
      return db.selectValue({
        sql: `
          SELECT
            EXISTS
            (
              SELECT 1
              FROM
                sqlite_master
              WHERE
                type = 'table'
                AND name = $table_name
              );
        `,
        bind: {
          $table_name: tableName,
        },
        schema: z.coerce.boolean(),
      })!;
    };

    if (!tableExists('building_ids')) {
      if (tableExists('building_ids_new')) {
        db.exec({
          sql: 'ALTER TABLE building_ids_new RENAME TO building_ids;',
        });
      } else {
        db.exec({ sql: createBuildingIdsTable });
        buildingIdsSeeder(db);
      }
    }

    db.exec({
      sql: 'CREATE INDEX IF NOT EXISTS idx_building_ids_building ON building_ids(building);',
    });

    const hasAsclepeionBuildingId = db.selectValue({
      sql: `
        SELECT
          EXISTS
          (
            SELECT 1
            FROM
              building_ids
            WHERE
              building = 'ASCLEPEION'
            );
      `,
      schema: z.coerce.boolean(),
    });

    if (!hasAsclepeionBuildingId) {
      db.exec({ sql: 'PRAGMA foreign_keys = OFF;' });

      try {
        db.transaction((tx) => {
          tx.exec({
            sql: 'DROP TRIGGER IF EXISTS trg_unit_training_history_delete;',
          });
          tx.exec({ sql: 'DROP TABLE IF EXISTS building_ids_new;' });

          tx.exec({
            sql: `
              CREATE TABLE building_ids_new
              (
                id INTEGER PRIMARY KEY,
                building TEXT NOT NULL UNIQUE CHECK (building IN
                                                     ('BARRACKS', 'GREAT_BARRACKS', 'STABLE', 'GREAT_STABLE',
                                                      'WORKSHOP', 'HOSPITAL', 'ASCLEPEION', 'CLAY_PIT', 'WHEAT_FIELD',
                                                      'WOODCUTTER', 'IRON_MINE', 'BAKERY', 'BRICKYARD', 'GRAIN_MILL',
                                                      'GRANARY', 'GREAT_GRANARY', 'IRON_FOUNDRY', 'SAWMILL',
                                                      'WAREHOUSE', 'GREAT_WAREHOUSE', 'WATERWORKS', 'ACADEMY',
                                                      'ROMAN_WALL', 'TEUTONIC_WALL', 'HEROS_MANSION', 'HUN_WALL',
                                                      'GAUL_WALL', 'RALLY_POINT', 'EGYPTIAN_WALL', 'TRAPPER', 'BREWERY',
                                                      'COMMAND_CENTER', 'CRANNY', 'HORSE_DRINKING_TROUGH',
                                                      'MAIN_BUILDING', 'MARKETPLACE', 'RESIDENCE', 'TOURNAMENT_SQUARE',
                                                      'TRADE_OFFICE', 'SMITHY', 'TOWN_HALL', 'EMBASSY', 'TREASURY',
                                                      'GATHERERS_HUT', 'HUNTERS_LODGE', 'SPARTAN_WALL', 'NATAR_WALL',
                                                      'NATURE_WALL'))
              ) STRICT;
            `,
          });

          tx.exec({
            sql: `
              INSERT OR IGNORE INTO
                building_ids_new (id, building)
              SELECT id, building
              FROM
                building_ids;
            `,
          });

          tx.exec({
            sql: `
              INSERT OR IGNORE INTO
                building_ids_new (building)
              VALUES
                ('ASCLEPEION');
            `,
          });

          tx.exec({ sql: 'DROP TABLE building_ids;' });
          tx.exec({
            sql: 'ALTER TABLE building_ids_new RENAME TO building_ids;',
          });
          tx.exec({
            sql: 'CREATE INDEX IF NOT EXISTS idx_building_ids_building ON building_ids(building);',
          });
        });
      } finally {
        db.exec({ sql: 'PRAGMA foreign_keys = ON;' });
      }

      setupHistoryTriggers(db);
    }

    db.exec({ sql: createWoundedTroopsTable });
    db.exec({ sql: createWoundedTroopsIndexes });
    db.exec({ sql: createBattleReportWoundedTroopsTriggers });
  });

  migrate('0.4.53', (db) => {
    db.exec({
      sql: 'DROP TRIGGER IF EXISTS reports_delete_details_before_delete;',
    });

    db.exec({
      sql: 'DROP TRIGGER IF EXISTS battle_report_units_create_wounded_troops_after_insert;',
    });

    db.exec({ sql: 'DROP TABLE IF EXISTS battle_report_units;' });
    db.exec({ sql: 'DROP TABLE IF EXISTS battle_report_buildings;' });

    db.exec({ sql: createBattleReportUnitsTable });
    db.exec({ sql: createBattleReportBuildingsTable });

    db.exec({
      sql: `
        CREATE INDEX IF NOT EXISTS idx_battle_report_buildings_report
          ON battle_report_buildings (report_id);
      `,
    });

    db.exec({ sql: createReportDeleteTriggers });
    db.exec({ sql: createBattleReportWoundedTroopsTriggers });

    setupGlobalWriteTriggers(db);
  });

  migrate('0.4.55', (db) => {
    for (const sql of [
      'DROP INDEX IF EXISTS idx_effects_effect_id;',
      'DROP INDEX IF EXISTS idx_effects_village_id;',
      'DROP INDEX IF EXISTS idx_effects_tile_id;',
      'DROP INDEX IF EXISTS idx_effects_village_effect_scope_spec;',
      'DROP INDEX IF EXISTS idx_effects_effect_village_scope_spec;',
      'DROP INDEX IF EXISTS idx_effects_effect_tile_scope_spec;',
      'DROP INDEX IF EXISTS idx_effects_tile_effect_scope_spec;',
      'DROP INDEX IF EXISTS idx_effects_resource_village;',
      'DROP INDEX IF EXISTS idx_effects_resource_tile;',
      'DROP INDEX IF EXISTS idx_effects_wheat_effect_village_value;',
      'DROP INDEX IF EXISTS idx_effects_wheat_effect_tile_value;',
    ]) {
      db.exec({ sql });
    }

    db.exec({ sql: 'PRAGMA foreign_keys = OFF;' });

    try {
      db.transaction((tx) => {
        tx.exec({ sql: 'ALTER TABLE effects RENAME TO effects_old;' });

        tx.exec({
          sql: `
            CREATE TABLE effects
            (
              id INTEGER PRIMARY KEY,
              effect_id INTEGER NOT NULL,
              value REAL NOT NULL,
              type_id INTEGER NOT NULL,
              scope_id INTEGER NOT NULL,
              source_id INTEGER NOT NULL,
              tile_id INTEGER,
              source_specifier INTEGER,

              FOREIGN KEY (effect_id) REFERENCES effect_ids (id),
              FOREIGN KEY (type_id) REFERENCES effect_type_ids (id),
              FOREIGN KEY (scope_id) REFERENCES effect_scope_ids (id),
              FOREIGN KEY (source_id) REFERENCES effect_source_ids (id),
              FOREIGN KEY (tile_id) REFERENCES tiles (id) ON DELETE CASCADE ON UPDATE CASCADE
            );
          `,
        });

        tx.exec({
          sql: `
            INSERT INTO effects (
              id,
              effect_id,
              value,
              type_id,
              scope_id,
              source_id,
              tile_id,
              source_specifier
            )
            SELECT
              e.id,
              e.effect_id,
              e.value,
              e.type_id,
              e.scope_id,
              e.source_id,
              v.tile_id,
              e.source_specifier
            FROM
              effects_old e
                LEFT JOIN villages v ON v.id = e.village_id;
          `,
        });

        tx.exec({ sql: 'DROP TABLE effects_old;' });
      });
    } finally {
      db.exec({ sql: 'PRAGMA foreign_keys = ON;' });
    }

    for (const sql of [
      'CREATE INDEX IF NOT EXISTS idx_effects_effect_id ON effects(effect_id);',
      'CREATE INDEX IF NOT EXISTS idx_effects_tile_id ON effects(tile_id);',
      `
        CREATE INDEX IF NOT EXISTS idx_effects_tile_effect_scope_spec
          ON effects(effect_id, tile_id, scope_id, source_specifier);
      `,
      `
        CREATE INDEX IF NOT EXISTS idx_effects_resource_tile
          ON effects(tile_id, effect_id, scope_id)
          WHERE tile_id IS NOT NULL;
      `,
      `
        CREATE INDEX IF NOT EXISTS idx_effects_wheat_effect_tile_value
          ON effects(effect_id, tile_id, value)
          WHERE scope_id = 2 AND source_specifier = 0 AND effect_id = 1;
      `,
    ]) {
      db.exec({ sql });
    }

    db.exec({
      sql: `
        UPDATE effects
        SET tile_id = source_specifier
        WHERE
          source_id = (SELECT id FROM effect_source_ids WHERE source = 'oasis')
          AND scope_id = (SELECT id FROM effect_scope_ids WHERE scope = 'local')
          AND tile_id IS NULL
          AND source_specifier IN (SELECT id FROM tiles);
      `,
    });

    db.exec({
      sql: `
        DELETE FROM effects
        WHERE
          source_id = (SELECT id FROM effect_source_ids WHERE source = 'oasis')
          AND scope_id = (SELECT id FROM effect_scope_ids WHERE scope = 'local')
          AND tile_id IS NULL;
      `,
    });

    db.exec({
      sql: `
        WITH
          effect_context(type_id, scope_id, source_id) AS (
            SELECT
              (SELECT id FROM effect_type_ids WHERE type = 'base'),
              (SELECT id FROM effect_scope_ids WHERE scope = 'local'),
              (SELECT id FROM effect_source_ids WHERE source = 'oasis')
          ),

          effect_lookup(effect, effect_id) AS (
            SELECT effect, id
            FROM effect_ids
            WHERE effect IN (
              'warehouseCapacity',
              'granaryCapacity',
              'woodProduction',
              'clayProduction',
              'ironProduction',
              'wheatProduction'
            )
          ),

          resource_effects(resource_id, effect_id) AS (
            SELECT
              ri.id,
              el.effect_id
            FROM
              resource_ids ri
                JOIN effect_lookup el ON el.effect = ri.resource || 'Production'
            WHERE
              ri.resource IN ('wood', 'clay', 'iron', 'wheat')
          ),

          storage_effects(effect_id) AS (
            SELECT effect_id
            FROM effect_lookup
            WHERE effect IN ('warehouseCapacity', 'granaryCapacity')
          ),

          oasis_capacity AS (
            SELECT
              tile_id,
              CASE
                WHEN MAX(bonus) = 50 OR COUNT(*) = 2 THEN 2000
                ELSE 1000
                END AS value
            FROM oasis
            GROUP BY tile_id
          ),

          oasis_production AS (
            SELECT
              tiles.tile_id,
              re.effect_id,
              CASE
                WHEN MAX(o.bonus) = 50 THEN 80
                WHEN MAX(o.bonus) = 25 THEN 40
                ELSE 10
                END AS value
            FROM
              (
                SELECT DISTINCT tile_id
                FROM oasis
              ) tiles
                CROSS JOIN resource_effects re
                LEFT JOIN oasis o ON o.tile_id = tiles.tile_id
                  AND o.resource_id = re.resource_id
            GROUP BY
              tiles.tile_id,
              re.effect_id
          ),

          oasis_effects_to_insert(effect_id, value, tile_id) AS (
            SELECT
              op.effect_id,
              op.value,
              op.tile_id
            FROM oasis_production op
            WHERE op.value > 0

            UNION ALL

            SELECT
              se.effect_id,
              oc.value,
              oc.tile_id
            FROM
              oasis_capacity oc
                CROSS JOIN storage_effects se
          )

        INSERT INTO effects (
          effect_id,
          value,
          type_id,
          scope_id,
          source_id,
          tile_id,
          source_specifier
        )
        SELECT
          oeti.effect_id,
          oeti.value,
          ec.type_id,
          ec.scope_id,
          ec.source_id,
          oeti.tile_id,
          oeti.tile_id
        FROM oasis_effects_to_insert oeti
          CROSS JOIN effect_context ec
        WHERE NOT EXISTS (
          SELECT 1
          FROM effects e
          WHERE
            e.effect_id = oeti.effect_id
            AND e.type_id = ec.type_id
            AND e.scope_id = ec.scope_id
            AND e.source_id = ec.source_id
            AND e.tile_id = oeti.tile_id
            AND e.source_specifier = oeti.tile_id
        );
      `,
    });

    for (const sql of [
      'DROP INDEX IF EXISTS idx_building_fields_building_id;',
      `
        CREATE INDEX IF NOT EXISTS idx_building_fields_building_id_level
          ON building_fields(building_id, level);
      `,
      `
        CREATE INDEX IF NOT EXISTS idx_reports_timestamp
          ON reports(timestamp DESC);
      `,
      `
        CREATE INDEX IF NOT EXISTS idx_reports_village_timestamp
          ON reports(village_id, timestamp DESC);
      `,
      `
        CREATE INDEX IF NOT EXISTS idx_battle_report_participants_battle
          ON battle_report_participants(battle_id);
      `,
      `
        CREATE INDEX IF NOT EXISTS idx_battle_report_buildings_report
          ON battle_report_buildings(report_id);
      `,
      'DROP INDEX IF EXISTS idx_unit_ids_unit;',
      'DROP INDEX IF EXISTS idx_resource_sites_tile_id;',
      'DROP INDEX IF EXISTS idx_villages_tile_id;',
    ]) {
      db.exec({ sql });
    }

    setupGlobalWriteTriggers(db);
  });

  migrate('0.4.57', (db) => {
    db.exec({
      sql: `
        UPDATE events
        SET
          meta = JSON_SET(
            meta,
            '$.troops',
            JSON((
              SELECT JSON_GROUP_ARRAY(JSON(updated_troop))
              FROM (
                SELECT
                  CASE
                    WHEN (
                      JSON_TYPE(troop.value, '$.sourceTileId') IS NULL
                      OR JSON_TYPE(troop.value, '$.sourceTileId') = 'null'
                    )
                    AND JSON_TYPE(troop.value, '$.tileId') IN ('integer', 'real')
                    THEN JSON_SET(
                      troop.value,
                      '$.sourceTileId',
                      JSON_EXTRACT(troop.value, '$.tileId')
                    )
                    ELSE troop.value
                  END AS updated_troop
                FROM JSON_EACH(events.meta, '$.troops') AS troop
                ORDER BY CAST(troop.key AS INTEGER)
              )
            ))
          )
        WHERE
          meta IS NOT NULL
          AND JSON_TYPE(meta, '$.troops') = 'array'
          AND EXISTS (
            SELECT 1
            FROM JSON_EACH(events.meta, '$.troops') AS troop
            WHERE
              (
                JSON_TYPE(troop.value, '$.sourceTileId') IS NULL
                OR JSON_TYPE(troop.value, '$.sourceTileId') = 'null'
              )
              AND JSON_TYPE(troop.value, '$.tileId') IN ('integer', 'real')
          );
      `,
    });
  });

  // If all migrations passed, bump it to current version
  if (databaseVersion !== targetDatabaseVersion) {
    database.exec({
      sql: `PRAGMA user_version=${targetDatabaseVersion};`,
    });
  }
};
