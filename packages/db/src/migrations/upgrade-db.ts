import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { DbFacade } from '@pillage-first/utils/facades/database';

// This function should only contain db upgrades between app's minor version bumps. At that point, these DB changes
// should already be part of the new schema, so contents of this function should be deleted
export const upgradeDb = (database: DbFacade): void => {
  const newBuildingIdsCount = database.selectValue({
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
              building TEXT NOT NULL UNIQUE CHECK (building IN
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

  database.exec({
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
        AND
        building_ids.building IN ('GATHERERS_HUT', 'HUNTERS_LODGE');
    `,
    bind: { $player_id: PLAYER_ID },
  });

  database.transaction((db) => {
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

    // Delete all heroes present in troops table
    db.exec({
      sql: `
        DELETE
        FROM
          troops
        WHERE
          unit_id = (
            SELECT id
            FROM unit_ids
            WHERE unit = 'HERO'
            )
      `,
    });

    // Insert a new hero unit into troops table for village with slug 'v-1'
    // if hero is not already in that village and not currently on an adventure
    db.exec({
      sql: `
        INSERT INTO
          troops (unit_id, amount, tile_id, source_tile_id)
        SELECT
          (
            SELECT id
            FROM unit_ids
            WHERE unit = 'HERO'
            ),
          1,
          v.tile_id,
          v.tile_id
        FROM
          villages v
            JOIN heroes h ON h.village_id = v.id
        WHERE
          v.slug = 'v-1'
          -- Hero has more than 0 health
          AND h.health > 0

          -- Hero is NOT currently on an adventure (no active troopMovementAdventure event for this village)
          AND NOT EXISTS
          (
            SELECT 1
            FROM
              events e
            WHERE
              e.village_id = v.id
              AND e.type = 'troopMovementAdventure'
            )
      `,
    });

    // Normalize legacy village_founding_history timestamps from milliseconds to seconds
    // Some historical rows were inserted by JS in milliseconds. Since triggers now set
    // timestamps via unixepoch() (seconds), convert any ms values at rest.
    db.exec({
      sql: `
        UPDATE village_founding_history
        SET
          timestamp = CASE
                        WHEN timestamp > 2000000000 THEN CAST(timestamp / 1000 AS INTEGER)
                        ELSE timestamp
            END
        WHERE
          timestamp > 2000000000;
      `,
    });
  });
};
