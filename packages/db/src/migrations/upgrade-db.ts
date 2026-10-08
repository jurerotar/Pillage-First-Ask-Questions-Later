import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { serverDbSchema } from '@pillage-first/types/models/server';
import { env } from '@pillage-first/utils/env';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { encodeAppVersionToDatabaseUserVersion } from '@pillage-first/utils/version';
import createFiltersTable from '../schemas/filters-schema.sql?raw';
import createHeroAuctionBuyListingsTable from '../schemas/hero-auction-buy-listings-schema.sql?raw';
import createHeroAuctionHistoryTable from '../schemas/hero-auction-history-schema.sql?raw';
import createHeroAuctionSellListingsTable from '../schemas/hero-auction-sell-listings-schema.sql?raw';
import createHuntingCaptureHistoryTable from '../schemas/history-tables/hunting-capture-history-schema.sql?raw';
import createReportOutcomeIdsTable from '../schemas/lookup-tables/report-outcome-ids-schema.sql?raw';
import createReportTypeIdsTable from '../schemas/lookup-tables/report-type-ids-schema.sql?raw';
import createScheduledConstructionCancellationReportsTable from '../schemas/scheduled-construction-cancellation-reports-schema.sql?raw';
import createScoutingReportsTable from '../schemas/scouting-reports-schema.sql?raw';
import createUnitImprovementReportsTable from '../schemas/unit-improvement-reports-schema.sql?raw';
import createUnitResearchReportsTable from '../schemas/unit-research-reports-schema.sql?raw';
import createVillageFoundingReportsTable from '../schemas/village-founding-reports-schema.sql?raw';
import { filtersSeeder } from '../seeders/filters-seeder';
import { worldItemsSeeder } from '../seeders/world-items-seeder';
import { setupGlobalWriteTriggers } from '../triggers/global-write-triggers';
import createReportDeleteTriggers from '../triggers/report-delete-triggers.sql?raw';
import { migrateTo } from './migrate-db';

const huntersLodgeQuestAnimalUnitIds = [
  'RAT',
  'SPIDER',
  'SERPENT',
  'BAT',
  'WILD_BOAR',
  'WOLF',
  'BEAR',
  'CROCODILE',
  'TIGER',
  'ELEPHANT',
] as const;

const huntersLodgeQuestCaptureCounts = [1, 3, 5, 10, 20, 50] as const;
const gatherersHutQuestResourceCounts = [
  20, 100, 500, 1000, 5000, 10_000, 50_000, 100_000,
] as const;

const indexesMissedBySingleStatementExec = [
  'CREATE INDEX IF NOT EXISTS idx_battle_report_buildings_report ON battle_report_buildings(report_id);',
  'CREATE INDEX IF NOT EXISTS idx_battle_report_participants_battle ON battle_report_participants(battle_id);',
  'CREATE INDEX IF NOT EXISTS idx_bookmarks_building_id ON bookmarks(building_id);',
  'CREATE INDEX IF NOT EXISTS idx_bookmarks_village_id ON bookmarks(village_id);',
  'CREATE INDEX IF NOT EXISTS idx_building_ids_building ON building_ids(building);',
  'CREATE INDEX IF NOT EXISTS idx_building_level_change_history_building_id ON building_level_change_history(building_id);',
  'CREATE INDEX IF NOT EXISTS idx_building_level_change_history_village_id ON building_level_change_history(village_id);',
  'CREATE INDEX IF NOT EXISTS idx_effect_ids_effect ON effect_ids(effect);',
  'CREATE INDEX IF NOT EXISTS idx_effects_resource_site_resources ON effects(effect_id, scope_id, tile_id, source_specifier, source_id, type_id, value);',
  'CREATE INDEX IF NOT EXISTS idx_effects_tile_effect_scope_spec ON effects(effect_id, tile_id, scope_id, source_specifier);',
  'CREATE INDEX IF NOT EXISTS idx_effects_tile_id ON effects(tile_id);',
  'CREATE INDEX IF NOT EXISTS idx_events_resolves_at ON events (resolves_at);',
  'CREATE INDEX IF NOT EXISTS idx_events_type ON events (type);',
  'CREATE INDEX IF NOT EXISTS idx_events_village_id ON events(village_id);',
  'CREATE INDEX IF NOT EXISTS idx_faction_ids_faction ON faction_ids(faction);',
  'CREATE INDEX IF NOT EXISTS idx_faction_reputation_source_faction_id ON faction_reputation (source_faction_id);',
  'CREATE INDEX IF NOT EXISTS idx_faction_reputation_target_faction_id ON faction_reputation (target_faction_id);',
  'CREATE INDEX IF NOT EXISTS idx_farm_list_tiles_farm_list_id ON farm_list_tiles(farm_list_id);',
  'CREATE INDEX IF NOT EXISTS idx_farm_list_tiles_tile_id ON farm_list_tiles(tile_id);',
  'CREATE INDEX IF NOT EXISTS idx_farm_lists_village_id ON farm_lists(village_id);',
  'CREATE INDEX IF NOT EXISTS idx_hero_adventures_hero_id ON hero_adventures(hero_id);',
  'CREATE INDEX IF NOT EXISTS idx_hero_equipped_items_hero_id ON hero_equipped_items(hero_id);',
  'CREATE INDEX IF NOT EXISTS idx_hero_inventory_hero_id ON hero_inventory(hero_id);',
  'CREATE INDEX IF NOT EXISTS idx_hero_selectable_attributes_hero_id ON hero_selectable_attributes(hero_id);',
  'CREATE INDEX IF NOT EXISTS idx_heroes_player_id ON heroes(player_id);',
  'CREATE INDEX IF NOT EXISTS idx_heroes_village_id ON heroes(village_id);',
  'CREATE INDEX IF NOT EXISTS idx_loyalties_tile_id ON loyalties(tile_id);',
  'CREATE INDEX IF NOT EXISTS idx_map_filters_player_id ON map_filters(player_id);',
  'CREATE INDEX IF NOT EXISTS idx_map_markers_player_id ON map_markers (player_id);',
  'CREATE INDEX IF NOT EXISTS idx_map_markers_tile_id ON map_markers (tile_id);',
  'CREATE INDEX IF NOT EXISTS idx_oasis_resource_bonus ON oasis(resource_id, bonus);',
  'CREATE INDEX IF NOT EXISTS idx_oasis_village_id ON oasis(village_id);',
  'CREATE INDEX IF NOT EXISTS idx_players_faction_id ON players (faction_id);',
  'CREATE INDEX IF NOT EXISTS idx_preferences_player_id ON preferences(player_id);',
  'CREATE INDEX IF NOT EXISTS idx_quests_quest_id ON quests (quest_id);',
  'CREATE INDEX IF NOT EXISTS idx_quests_village_id_notnull ON quests(village_id) WHERE village_id IS NOT NULL;',
  'CREATE INDEX IF NOT EXISTS idx_report_type_ids_report_type ON report_type_ids(report_type);',
  'CREATE INDEX IF NOT EXISTS idx_reports_village_timestamp ON reports(village_id, timestamp DESC);',
  'CREATE INDEX IF NOT EXISTS idx_resource_ids_resource ON resource_ids(resource);',
  'CREATE INDEX IF NOT EXISTS idx_scheduled_building_construction_cancellation_history_village_id ON scheduled_building_construction_cancellation_history(village_id);',
  'CREATE INDEX IF NOT EXISTS idx_scheduled_building_upgrades_field_level ON scheduled_building_upgrades (village_id, building_field_id, level);',
  'CREATE INDEX IF NOT EXISTS idx_scheduled_building_upgrades_village_order ON scheduled_building_upgrades (village_id, queue_position);',
  'CREATE INDEX IF NOT EXISTS idx_tile_type_ids_type ON tile_type_ids(type);',
  'CREATE INDEX IF NOT EXISTS idx_tiles_type_xy ON tiles(type_id, x, y);',
  'CREATE INDEX IF NOT EXISTS idx_tiles_xy ON tiles(x, y);',
  'CREATE INDEX IF NOT EXISTS idx_trapper_cages_village_id_unit_id ON trapper_cages (village_id, unit_id);',
  'CREATE INDEX IF NOT EXISTS idx_tribe_ids_tribe ON tribe_ids(tribe);',
  'CREATE INDEX IF NOT EXISTS idx_troops_source_tile_id ON troops (source_tile_id);',
  'CREATE INDEX IF NOT EXISTS idx_troops_tile_id ON troops (tile_id);',
  'CREATE INDEX IF NOT EXISTS idx_troops_tile_unit ON troops(tile_id, unit_id);',
  'CREATE INDEX IF NOT EXISTS idx_unit_improvement_history_player_id ON unit_improvement_history(player_id);',
  'CREATE INDEX IF NOT EXISTS idx_unit_improvement_history_unit_id ON unit_improvement_history(unit_id);',
  'CREATE INDEX IF NOT EXISTS idx_unit_improvements_unit_id ON unit_improvements(unit_id);',
  'CREATE INDEX IF NOT EXISTS idx_unit_research_history_unit_id ON unit_research_history(unit_id);',
  'CREATE INDEX IF NOT EXISTS idx_unit_research_history_village_id ON unit_research_history(village_id);',
  'CREATE INDEX IF NOT EXISTS idx_unit_research_unit_id ON unit_research(unit_id);',
  'CREATE INDEX IF NOT EXISTS idx_unit_training_history_building_id ON unit_training_history(building_id);',
  'CREATE INDEX IF NOT EXISTS idx_unit_training_history_unit_id ON unit_training_history(unit_id);',
  'CREATE INDEX IF NOT EXISTS idx_unit_training_history_village_id ON unit_training_history(village_id);',
  'CREATE INDEX IF NOT EXISTS idx_village_founding_history_tile_id ON village_founding_history(tile_id);',
  'CREATE INDEX IF NOT EXISTS idx_village_founding_history_village_id ON village_founding_history(village_id);',
  'CREATE INDEX IF NOT EXISTS idx_wounded_troops_unit_id ON wounded_troops(unit_id);',
];

const huntersLodgeAndGatherersHutGlobalQuestIds = [
  ...huntersLodgeQuestAnimalUnitIds.flatMap((unitId) =>
    huntersLodgeQuestCaptureCounts.map(
      (count) => `captureAnimalCountById-${unitId}-${count}`,
    ),
  ),
  `captureAnimalKindCount-${huntersLodgeQuestAnimalUnitIds.length}`,
  ...gatherersHutQuestResourceCounts.map(
    (count) => `gatheredResourceCount-${count}`,
  ),
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

  migrate('0.4.55', (db) => {
    db.execMulti({
      sql: `
        DROP INDEX IF EXISTS idx_effects_effect_id;
        DROP INDEX IF EXISTS idx_effects_village_id;
        DROP INDEX IF EXISTS idx_effects_tile_id;
        DROP INDEX IF EXISTS idx_effects_village_effect_scope_spec;
        DROP INDEX IF EXISTS idx_effects_effect_village_scope_spec;
        DROP INDEX IF EXISTS idx_effects_effect_tile_scope_spec;
        DROP INDEX IF EXISTS idx_effects_tile_effect_scope_spec;
        DROP INDEX IF EXISTS idx_effects_resource_village;
        DROP INDEX IF EXISTS idx_effects_resource_tile;
        DROP INDEX IF EXISTS idx_effects_wheat_effect_village_value;
        DROP INDEX IF EXISTS idx_effects_wheat_effect_tile_value;
      `,
    });

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
            INSERT INTO
              effects (id, effect_id, value, type_id, scope_id, source_id, tile_id, source_specifier)
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

    db.execMulti({
      sql: `
        CREATE INDEX IF NOT EXISTS idx_effects_effect_id ON effects(effect_id);
        CREATE INDEX IF NOT EXISTS idx_effects_tile_id ON effects(tile_id);
        CREATE INDEX IF NOT EXISTS idx_effects_tile_effect_scope_spec
          ON effects (effect_id, tile_id, scope_id, source_specifier);
      `,
    });

    db.exec({
      sql: `
        UPDATE effects
        SET
          tile_id = source_specifier
        WHERE
          source_id = (
            SELECT id
            FROM effect_source_ids
            WHERE source = 'oasis'
            )
          AND scope_id = (
            SELECT id
            FROM effect_scope_ids
            WHERE scope = 'local'
            )
          AND tile_id IS NULL
          AND source_specifier IN (
            SELECT id
            FROM tiles
            );
      `,
    });

    db.exec({
      sql: `
        DELETE
        FROM
          effects
        WHERE
          source_id = (
            SELECT id
            FROM effect_source_ids
            WHERE source = 'oasis'
            )
          AND scope_id = (
            SELECT id
            FROM effect_scope_ids
            WHERE scope = 'local'
            )
          AND tile_id IS NULL;
      `,
    });

    db.exec({
      sql: `
        WITH
          effect_context(type_id, scope_id, source_id) AS (
            SELECT
              (
                SELECT id
                FROM effect_type_ids
                WHERE type = 'base'
                ),
              (
                SELECT id
                FROM effect_scope_ids
                WHERE scope = 'local'
                ),
              (
                SELECT id
                FROM effect_source_ids
                WHERE source = 'oasis'
                )
            ),

          effect_lookup(effect, effect_id) AS (
            SELECT effect, id
            FROM
              effect_ids
            WHERE
              effect IN (
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
            FROM
              effect_lookup
            WHERE
              effect IN ('warehouseCapacity', 'granaryCapacity')
            ),

          oasis_capacity AS (
            SELECT
              tile_id,
              CASE
                WHEN MAX(bonus) = 50 OR COUNT(*) = 2 THEN 2000
                ELSE 1000
                END AS value
            FROM
              oasis
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
                FROM
                  oasis
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
            FROM
              oasis_production op
            WHERE
              op.value > 0

            UNION ALL

            SELECT
              se.effect_id,
              oc.value,
              oc.tile_id
            FROM
              oasis_capacity oc
                CROSS JOIN storage_effects se
            )

        INSERT
        INTO
          effects (effect_id, value, type_id, scope_id, source_id, tile_id, source_specifier)
        SELECT
          oeti.effect_id,
          oeti.value,
          ec.type_id,
          ec.scope_id,
          ec.source_id,
          oeti.tile_id,
          oeti.tile_id
        FROM
          oasis_effects_to_insert oeti
            CROSS JOIN effect_context ec
        WHERE
          NOT EXISTS
          (
            SELECT 1
            FROM
              effects e
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

    db.execMulti({
      sql: `
        DROP INDEX IF EXISTS idx_building_fields_building_id;
        CREATE INDEX IF NOT EXISTS idx_building_fields_building_id_level
          ON building_fields (building_id, level);
        CREATE INDEX IF NOT EXISTS idx_reports_timestamp
          ON reports (timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_reports_village_timestamp
          ON reports (village_id, timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_battle_report_participants_battle
          ON battle_report_participants (battle_id);
        CREATE INDEX IF NOT EXISTS idx_battle_report_buildings_report
          ON battle_report_buildings (report_id);
        DROP INDEX IF EXISTS idx_unit_ids_unit;
        DROP INDEX IF EXISTS idx_resource_sites_tile_id;
        DROP INDEX IF EXISTS idx_villages_tile_id;
      `,
    });

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
              FROM
                (
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
                  FROM
                    JSON_EACH(events.meta, '$.troops') AS troop
                  ORDER BY CAST(troop.key AS INTEGER)
                  )
              ))
                 )
        WHERE
          meta IS NOT NULL
          AND JSON_TYPE(meta, '$.troops') = 'array'
          AND EXISTS
          (
            SELECT 1
            FROM
              JSON_EACH(events.meta, '$.troops') AS troop
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

  migrate('0.4.58', (db) => {
    db.exec({
      sql: `
        CREATE INDEX IF NOT EXISTS idx_effects_resource_site_resources
          ON effects (effect_id, scope_id, tile_id, source_specifier, source_id, type_id, value);
      `,
    });

    db.exec({ sql: 'DROP INDEX IF EXISTS idx_effects_resource_tile;' });
    db.exec({
      sql: 'DROP INDEX IF EXISTS idx_effects_wheat_effect_tile_value;',
    });
  });

  migrate('0.4.62', (db) => {
    const completedAt = Date.now();

    db.transaction((tx) => {
      tx.exec({
        sql: `
          INSERT INTO quests (quest_id, completed_at, collected_at, village_id)
          SELECT quest_id.value, NULL, NULL, NULL
          FROM json_each($quest_ids) AS quest_id
          WHERE NOT EXISTS (
            SELECT 1
            FROM quests q
            WHERE
              q.quest_id = quest_id.value
              AND q.village_id IS NULL
          );
        `,
        bind: {
          $quest_ids: JSON.stringify(huntersLodgeAndGatherersHutGlobalQuestIds),
        },
      });

      tx.exec({
        sql: `
          UPDATE quests
          SET
            completed_at = $completed_at
          WHERE
            completed_at IS NULL
            AND village_id IS NULL
            AND quest_id LIKE 'captureAnimalCountById-%'
            AND EXISTS (
              SELECT 1
              FROM unit_ids captured_unit_ids
              WHERE
                captured_unit_ids.unit IN (
                  SELECT value
                  FROM json_each($animal_unit_ids)
                )
                AND quest_id LIKE 'captureAnimalCountById-' || captured_unit_ids.unit || '-%'
                AND substr(
                  quest_id,
                  length('captureAnimalCountById-' || captured_unit_ids.unit || '-') + 1
                ) GLOB '[0-9]*'
                AND (
                  SELECT COALESCE(SUM(hpru.amount), 0)
                  FROM hunting_party_report_units hpru
                  JOIN hunting_party_reports hpr
                    ON hpr.id = hpru.hunting_party_report_id
                  JOIN reports r ON r.id = hpr.report_id
                  JOIN villages v ON v.id = r.village_id
                  WHERE
                    v.player_id = $player_id
                    AND hpru.unit_id = captured_unit_ids.id
                ) >= CAST(
                  substr(
                    quest_id,
                    length('captureAnimalCountById-' || captured_unit_ids.unit || '-') + 1
                  ) AS INTEGER
                )
            );
        `,
        bind: {
          $completed_at: completedAt,
          $animal_unit_ids: JSON.stringify(huntersLodgeQuestAnimalUnitIds),
          $player_id: PLAYER_ID,
        },
      });

      tx.exec({
        sql: `
          UPDATE quests
          SET
            completed_at = $completed_at
          WHERE
            completed_at IS NULL
            AND village_id IS NULL
            AND quest_id LIKE 'captureAnimalKindCount-%'
            AND substr(quest_id, length('captureAnimalKindCount-') + 1) GLOB '[0-9]*'
            AND (
              SELECT COUNT(*)
              FROM (
                SELECT ui.unit
                FROM hunting_party_report_units hpru
                JOIN unit_ids ui ON ui.id = hpru.unit_id
                JOIN hunting_party_reports hpr
                  ON hpr.id = hpru.hunting_party_report_id
                JOIN reports r ON r.id = hpr.report_id
                JOIN villages v ON v.id = r.village_id
                WHERE
                  v.player_id = $player_id
                  AND ui.unit IN (
                    SELECT value
                    FROM json_each($animal_unit_ids)
                  )
                GROUP BY ui.unit
                HAVING SUM(hpru.amount) > 0
              )
            ) >= CAST(
              substr(quest_id, length('captureAnimalKindCount-') + 1) AS INTEGER
            );
        `,
        bind: {
          $completed_at: completedAt,
          $animal_unit_ids: JSON.stringify(huntersLodgeQuestAnimalUnitIds),
          $player_id: PLAYER_ID,
        },
      });

      tx.exec({
        sql: `
          UPDATE quests
          SET
            completed_at = $completed_at
          WHERE
            completed_at IS NULL
            AND village_id IS NULL
            AND quest_id LIKE 'gatheredResourceCount-%'
            AND substr(quest_id, length('gatheredResourceCount-') + 1) GLOB '[0-9]*'
            AND (
              SELECT COALESCE(
                SUM(
                  ger.loot_wood +
                  ger.loot_clay +
                  ger.loot_iron +
                  ger.loot_wheat
                ),
                0
              )
              FROM gathering_expedition_reports ger
              JOIN reports r ON r.id = ger.report_id
              JOIN villages v ON v.id = r.village_id
              WHERE v.player_id = $player_id
            ) >= CAST(
              substr(quest_id, length('gatheredResourceCount-') + 1) AS INTEGER
            );
        `,
        bind: {
          $completed_at: completedAt,
          $player_id: PLAYER_ID,
        },
      });
    });
  });

  migrate('0.4.64', (db) => {
    db.exec({
      sql: `
        DELETE
        FROM
          world_items
        WHERE
          item_id IN (1026, 1027, 1028, 1029);
      `,
    });

    db.exec({
      sql: 'ALTER TABLE map_filters DROP COLUMN should_show_treasure_icons;',
    });
  });

  migrate('0.4.66', (db) => {
    db.exec({
      sql: 'ALTER TABLE battle_reports ADD COLUMN item_id INTEGER;',
    });
    db.exec({
      sql: 'ALTER TABLE battle_reports ADD COLUMN item_amount INTEGER CHECK (item_amount > 0);',
    });

    db.exec({ sql: 'PRAGMA foreign_keys = OFF;' });
    db.exec({ sql: 'PRAGMA legacy_alter_table = ON;' });

    try {
      db.transaction((tx) => {
        tx.exec({
          sql: 'ALTER TABLE scouting_reports RENAME TO scouting_reports_old;',
        });
        tx.execMulti({ sql: createScoutingReportsTable });
        tx.exec({ sql: 'DROP TABLE scouting_reports_old;' });
      });
    } finally {
      db.exec({ sql: 'PRAGMA legacy_alter_table = OFF;' });
      db.exec({ sql: 'PRAGMA foreign_keys = ON;' });
    }

    db.exec({
      sql: `
        DELETE
        FROM
          world_items;
      `,
    });

    const server = db.selectObject({
      sql: 'SELECT * FROM servers LIMIT 1;',
      schema: serverDbSchema,
    })!;

    worldItemsSeeder(db, server);

    db.execMulti({ sql: createHeroAuctionBuyListingsTable });
    db.execMulti({ sql: createHeroAuctionSellListingsTable });
    db.execMulti({ sql: createHeroAuctionHistoryTable });
  });

  migrate('0.4.67', (db) => {
    db.transaction((tx) => {
      tx.exec({
        sql: `
          UPDATE effects
          SET
            value = 1 + (o.bonus / 100.0) * (
              -- Waterworks now lives in occupied oasis bonus rows instead of
              -- generic building effects; normalize existing saved worlds.
              1 + 0.05 * COALESCE((
                SELECT MAX(bf.level)
                FROM
                  villages v
                    JOIN building_fields bf ON bf.village_id = v.id
                    JOIN building_ids bi ON bi.id = bf.building_id
                WHERE
                  v.tile_id = effects.tile_id
                  AND bi.building = 'WATERWORKS'
              ), 0)
            )
          FROM
            oasis o
              JOIN resource_ids ri ON ri.id = o.resource_id
              JOIN effect_ids ei ON ei.effect = ri.resource || 'Production'
          WHERE
            effects.effect_id = ei.id
            AND effects.type_id = (SELECT id FROM effect_type_ids WHERE type = 'bonus')
            AND effects.scope_id = (SELECT id FROM effect_scope_ids WHERE scope = 'local')
            AND effects.source_id = (SELECT id FROM effect_source_ids WHERE source = 'oasis')
            AND effects.source_specifier = o.tile_id;
        `,
      });

      tx.exec({
        sql: `
          DELETE
          FROM
            effects
          WHERE
            source_id = (SELECT id FROM effect_source_ids WHERE source = 'building')
            AND EXISTS (
              SELECT 1
              FROM
                villages v
                  JOIN building_fields bf ON bf.village_id = v.id
                  JOIN building_ids bi ON bi.id = bf.building_id
              WHERE
                v.tile_id = effects.tile_id
                AND bf.field_id = effects.source_specifier
                AND bi.building = 'WATERWORKS'
            );
        `,
      });
    });
  });

  migrate('0.4.69', (db) => {
    db.exec({
      sql: `
        UPDATE events
        SET
          meta = JSON_SET(
            COALESCE(meta, '{}'),
            '$.repeatRemaining',
            COALESCE(JSON_EXTRACT(meta, '$.repeatRemaining'), 0),
            '$.repeatResources',
            JSON(COALESCE(
              JSON_EXTRACT(meta, '$.repeatResources'),
              JSON_EXTRACT(meta, '$.resources'),
              '{"wood":0,"clay":0,"iron":0,"wheat":0}'
            ))
          )
        WHERE
          type = 'resourceTransfer'
          AND (
            JSON_TYPE(meta, '$.repeatRemaining') IS NULL
            OR JSON_TYPE(meta, '$.repeatResources') IS NULL
          );
      `,
    });
  });

  migrate('0.4.70', (db) => {
    db.transaction((tx) => {
      tx.execMulti({ sql: indexesMissedBySingleStatementExec.join('\n') });

      tx.exec({ sql: 'REINDEX;' });
    });

    db.exec({ sql: 'VACUUM;' });
  });

  migrate('0.4.71', (db) => {
    db.exec({ sql: 'PRAGMA foreign_keys = OFF;' });
    db.exec({ sql: 'PRAGMA legacy_alter_table = ON;' });

    try {
      db.transaction((tx) => {
        tx.exec({
          sql: 'DROP INDEX IF EXISTS idx_report_type_ids_report_type;',
        });
        tx.exec({
          sql: 'ALTER TABLE report_type_ids RENAME TO report_type_ids_old;',
        });
        tx.execMulti({ sql: createReportTypeIdsTable });
        tx.exec({
          sql: `
            INSERT INTO report_type_ids (id, report_type)
            SELECT id, report_type
            FROM report_type_ids_old;
          `,
        });
        tx.exec({
          sql: `
            INSERT OR IGNORE INTO report_type_ids (report_type)
            VALUES
              ('unitResearch'),
              ('unitImprovement'),
              ('villageFounded'),
              ('scheduledConstructionCancellation');
          `,
        });
        tx.exec({ sql: 'DROP TABLE report_type_ids_old;' });

        tx.exec({
          sql: 'ALTER TABLE report_outcome_ids RENAME TO report_outcome_ids_old;',
        });
        tx.exec({ sql: createReportOutcomeIdsTable });
        tx.exec({
          sql: `
            INSERT INTO report_outcome_ids (id, report_outcome)
            SELECT id, report_outcome
            FROM report_outcome_ids_old;
          `,
        });
        tx.exec({
          sql: `
            INSERT OR IGNORE INTO report_outcome_ids (report_outcome)
            VALUES
              ('unitResearched'),
              ('unitImproved'),
              ('villageFounded'),
              ('scheduledConstructionCancelled');
          `,
        });
        tx.exec({ sql: 'DROP TABLE report_outcome_ids_old;' });
      });
    } finally {
      db.exec({ sql: 'PRAGMA legacy_alter_table = OFF;' });
      db.exec({ sql: 'PRAGMA foreign_keys = ON;' });
    }

    db.execMulti({ sql: createUnitResearchReportsTable });
    db.execMulti({ sql: createUnitImprovementReportsTable });
    db.execMulti({ sql: createVillageFoundingReportsTable });
    db.execMulti({ sql: createScheduledConstructionCancellationReportsTable });
    db.execMulti({ sql: createFiltersTable });

    filtersSeeder(db);

    db.execMulti({
      sql: `
        DROP TRIGGER IF EXISTS trg_unit_improvement_history_update;
        DROP TRIGGER IF EXISTS trg_unit_improvement_history_insert;
        DROP TRIGGER IF EXISTS trg_unit_research_history_insert;
        DROP TABLE IF EXISTS unit_improvement_history;
        DROP TABLE IF EXISTS unit_research_history;
        DROP TABLE IF EXISTS village_founding_history;
      `,
    });

    db.exec({
      sql: 'DROP TRIGGER IF EXISTS reports_delete_details_before_delete;',
    });

    db.execMulti({ sql: createReportDeleteTriggers });

    setupGlobalWriteTriggers(db);
  });

  migrate('0.4.72', (db) => {
    db.exec({
      sql: `
        ALTER TABLE preferences
        ADD COLUMN village_sort TEXT NOT NULL DEFAULT 'alphabetic'
        CHECK (village_sort IN ('alphabetic', 'populationAsc', 'populationDesc'));
      `,
    });
  });

  migrate('0.4.73', (db) => {
    db.transaction((tx) => {
      tx.execMulti({ sql: createHuntingCaptureHistoryTable });

      // Deleted reports cannot be recovered. Preserve the catches still recorded
      // in reports before enabling lifetime tracking for future hunts.
      tx.exec({
        sql: `
          INSERT INTO hunting_capture_history (player_id, unit_id, amount)
          SELECT v.player_id, hpru.unit_id, SUM(hpru.amount)
          FROM hunting_party_report_units hpru
          JOIN hunting_party_reports hpr ON hpr.id = hpru.hunting_party_report_id
          JOIN reports r ON r.id = hpr.report_id
          JOIN villages v ON v.id = r.village_id
          GROUP BY v.player_id, hpru.unit_id
          HAVING SUM(hpru.amount) > 0;
        `,
      });

      // Completed quests provide a proven lower bound even if their reports
      // have already been deleted.
      tx.exec({
        sql: `
          INSERT INTO hunting_capture_history (player_id, unit_id, amount)
          SELECT $player_id, ui.id,
            MAX(CAST(substr(q.quest_id, length('captureAnimalCountById-' || ui.unit || '-') + 1) AS INTEGER))
          FROM quests q
          JOIN unit_ids ui ON substr(q.quest_id, 1, length('captureAnimalCountById-' || ui.unit || '-'))
            = 'captureAnimalCountById-' || ui.unit || '-'
          WHERE q.village_id IS NULL AND q.completed_at IS NOT NULL
          GROUP BY ui.id
          HAVING MAX(CAST(substr(q.quest_id, length('captureAnimalCountById-' || ui.unit || '-') + 1) AS INTEGER)) > 0
          ON CONFLICT (player_id, unit_id) DO UPDATE SET
            amount = MAX(hunting_capture_history.amount, EXCLUDED.amount);
        `,
        bind: { $player_id: PLAYER_ID },
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
