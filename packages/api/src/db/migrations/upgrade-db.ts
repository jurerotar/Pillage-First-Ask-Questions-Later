import { z } from 'zod';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { calculateCulturePointsRequirementForVillageCount } from '@pillage-first/game-assets/utils/culture-points';
import { serverDbSchema } from '@pillage-first/types/models/server';
import { env } from '@pillage-first/utils/env';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { encodeAppVersionToDatabaseUserVersion } from '@pillage-first/utils/version';
import createBattleReportBuildingsTable from '../schemas/battle-report-buildings-schema.sql?raw';
import createBattleReportCapturedAnimalsTable from '../schemas/battle-report-captured-animals-schema.sql?raw';
import createBattleReportConquestsTable from '../schemas/battle-report-conquests-schema.sql?raw';
import createBattleReportConsumablesTable from '../schemas/battle-report-consumables-schema.sql?raw';
import createBattleReportHeroesTable from '../schemas/battle-report-heroes-schema.sql?raw';
import createBattleReportRescuedUnitsTable from '../schemas/battle-report-rescued-units-schema.sql?raw';
import createBattleReportRescuesTable from '../schemas/battle-report-rescues-schema.sql?raw';
import createBattleReportStolenItemsTable from '../schemas/battle-report-stolen-items-schema.sql?raw';
import createBattleReportUnitsTable from '../schemas/battle-report-units-schema.sql?raw';
import createBattleReportsTable from '../schemas/battle-reports-schema.sql?raw';
import createCulturePointsTable from '../schemas/culture-points-schema.sql?raw';
import createFactionReputationTable from '../schemas/faction-reputation-schema.sql?raw';
import createFiltersTable from '../schemas/filters-schema.sql?raw';
import createHeroAuctionBuyListingsTable from '../schemas/hero-auction-buy-listings-schema.sql?raw';
import createHeroAuctionHistoryTable from '../schemas/hero-auction-history-schema.sql?raw';
import createHeroAuctionSellListingsTable from '../schemas/hero-auction-sell-listings-schema.sql?raw';
import createHuntingCaptureHistoryTable from '../schemas/history-tables/hunting-capture-history-schema.sql?raw';
import createOasisCaptureFailureReasonIdsTable from '../schemas/lookup-tables/oasis-capture-failure-reason-ids-schema.sql?raw';
import createReportOutcomeIdsTable from '../schemas/lookup-tables/report-outcome-ids-schema.sql?raw';
import createReportTypeIdsTable from '../schemas/lookup-tables/report-type-ids-schema.sql?raw';
import createVillageConquestFailureReasonIdsTable from '../schemas/lookup-tables/village-conquest-failure-reason-ids-schema.sql?raw';
import createQuestsTable from '../schemas/quests-schema.sql?raw';
import createReportGenerationSettingsTable from '../schemas/report-generation-settings-schema.sql?raw';
import createScheduledConstructionCancellationReportsTable from '../schemas/scheduled-construction-cancellation-reports-schema.sql?raw';
import createScoutingReportsTable from '../schemas/scouting-reports-schema.sql?raw';
import createTradeRoutesTable from '../schemas/trade-routes-schema.sql?raw';
import createUnitImprovementReportsTable from '../schemas/unit-improvement-reports-schema.sql?raw';
import createUnitResearchReportsTable from '../schemas/unit-research-reports-schema.sql?raw';
import createVillageFoundingReportsTable from '../schemas/village-founding-reports-schema.sql?raw';
import { filtersSeeder } from '../seeders/filters-seeder';
import { oasisCaptureFailureReasonIdsSeeder } from '../seeders/oasis-capture-failure-reason-ids-seeder';
import { villageConquestFailureReasonIdsSeeder } from '../seeders/village-conquest-failure-reason-ids-seeder';
import { worldItemsSeeder } from '../seeders/world-items-seeder';
import { setupGlobalWriteTriggers } from '../triggers/global-write-triggers';
import createReportDeleteTriggers from '../triggers/report-delete-triggers.sql?raw';
import { migrateTo } from './migrate-db';

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

  migrate('0.4.74', (db) => {
    db.transaction((tx) => {
      tx.execMulti({
        sql: `
          DROP INDEX IF EXISTS idx_villages_player_id;
          DROP INDEX IF EXISTS idx_villages_slug;
          DROP INDEX IF EXISTS idx_bookmarks_building_id;
          DROP INDEX IF EXISTS idx_bookmarks_village_id;
          DROP INDEX IF EXISTS idx_building_ids_building;
          DROP INDEX IF EXISTS idx_building_level_change_history_building_id;
          DROP INDEX IF EXISTS idx_effect_ids_effect;
          DROP INDEX IF EXISTS idx_effects_effect_id;
          DROP INDEX IF EXISTS idx_faction_ids_faction;
          DROP INDEX IF EXISTS idx_faction_reputation_source_faction_id;
          DROP INDEX IF EXISTS idx_faction_reputation_target_faction_id;
          DROP INDEX IF EXISTS idx_farm_list_tiles_farm_list_id;
          DROP INDEX IF EXISTS idx_hero_adventures_hero_id;
          DROP INDEX IF EXISTS idx_hero_equipped_items_hero_id;
          DROP INDEX IF EXISTS idx_hero_inventory_hero_id;
          DROP INDEX IF EXISTS idx_hero_selectable_attributes_hero_id;
          DROP INDEX IF EXISTS idx_loyalties_tile_id;
          DROP INDEX IF EXISTS idx_map_filters_player_id;
          DROP INDEX IF EXISTS idx_preferences_player_id;
          DROP INDEX IF EXISTS idx_report_type_ids_report_type;
          DROP INDEX IF EXISTS idx_resource_ids_resource;
          DROP INDEX IF EXISTS idx_tile_type_ids_type;
          DROP INDEX IF EXISTS idx_tiles_rfc_id;
          DROP INDEX IF EXISTS idx_trapper_cages_village_id;
          DROP INDEX IF EXISTS idx_tribe_ids_tribe;
          DROP INDEX IF EXISTS idx_troops_tile_id;
          DROP INDEX IF EXISTS idx_troops_unit_id;
          DROP INDEX IF EXISTS idx_unit_improvements_unit_id;
          DROP INDEX IF EXISTS idx_unit_research_unit_id;
          DROP INDEX IF EXISTS idx_unit_training_history_building_id;
          DROP INDEX IF EXISTS idx_world_items_tile_id;
          DROP INDEX IF EXISTS idx_wounded_troops_unit_id;
          DROP INDEX IF EXISTS idx_wounded_troops_village_id;
          CREATE INDEX idx_villages_player_id ON villages (player_id);
          CREATE INDEX idx_villages_slug ON villages (slug) WHERE slug IS NOT NULL;
        `,
      });
    });
  });

  migrate('0.4.76', (db) => {
    db.transaction((tx) => {
      tx.exec({
        sql: `
          ALTER TABLE servers
          ADD COLUMN culture_points_requirement_speed INTEGER CHECK (culture_points_requirement_speed IN (1, 2, 3, 4, 5)) NOT NULL DEFAULT 1;
        `,
      });

      tx.execMulti({ sql: createCulturePointsTable });

      const villageCount = tx.selectValue({
        sql: `
          SELECT
            (
              SELECT COUNT(*)
              FROM villages v
              WHERE v.player_id = $player_id
            ) + (
              SELECT COUNT(*)
              FROM events e
                JOIN villages v ON v.id = e.village_id
              WHERE
                v.player_id = $player_id
                AND e.type = 'troopMovementFindNewVillage'
            ) AS village_count;
        `,
        bind: { $player_id: PLAYER_ID },
        schema: z.number(),
      })!;

      tx.exec({
        sql: `
          INSERT INTO culture_points
            (player_id, culture_points, culture_points_updated_at)
          VALUES ($player_id, $culture_points, $updated_at);
        `,
        bind: {
          $culture_points: calculateCulturePointsRequirementForVillageCount(
            villageCount,
            1,
          ),
          $updated_at: Date.now(),
          $player_id: PLAYER_ID,
        },
      });

      setupGlobalWriteTriggers(tx);
    });
  });

  migrate('0.4.77', (db) => {
    db.exec({
      sql: "ALTER TABLE map_markers ADD COLUMN icon TEXT NOT NULL DEFAULT 'mapMarker';",
    });

    db.exec({
      sql: `
        INSERT INTO effects (effect_id, value, type_id, scope_id, source_id)
        SELECT e.id, 1.0 / s.speed, t.id, sc.id, so.id
        FROM effect_ids e, servers s, effect_type_ids t,
          effect_scope_ids sc, effect_source_ids so
        WHERE e.effect = 'residenceTrainingDuration'
          AND t.type = 'bonus' AND sc.scope = 'server' AND so.source = 'server'
          AND NOT EXISTS (
            SELECT 1 FROM effects existing
            WHERE existing.effect_id = e.id AND existing.scope_id = sc.id
          );
      `,
    });
  });

  migrate('0.4.78', (db) => {
    db.exec({
      sql: 'ALTER TABLE developer_settings ADD COLUMN is_free_celebrations_enabled INTEGER NOT NULL DEFAULT 0 CHECK (is_free_celebrations_enabled IN (0, 1));',
    });

    db.exec({
      sql: 'ALTER TABLE developer_settings ADD COLUMN is_instant_celebrations_enabled INTEGER NOT NULL DEFAULT 0 CHECK (is_instant_celebrations_enabled IN (0, 1));',
    });
  });

  migrate('0.4.80', (db) => {
    db.transaction((tx) => {
      // Earlier migrations create this table using the current schema.
      const hasCelebrationsHeld = tx.selectValue({
        sql: "SELECT COUNT(*) FROM pragma_table_info('culture_points') WHERE name = 'celebrations_held';",
        schema: z.number(),
      });

      if (!hasCelebrationsHeld) {
        tx.exec({
          sql: 'ALTER TABLE culture_points ADD COLUMN celebrations_held INTEGER NOT NULL DEFAULT 0 CHECK (celebrations_held >= 0);',
        });
      }

      for (const count of [1, 3, 5, 10, 15, 20, 30, 50, 75, 100]) {
        tx.exec({
          sql: `INSERT INTO quests (quest_id, village_id)
            SELECT $quest_id, NULL
            WHERE NOT EXISTS (
              SELECT 1 FROM quests WHERE quest_id = $quest_id AND village_id IS NULL
            );`,
          bind: { $quest_id: `celebrationCount-${count}` },
        });
      }
    });
  });

  migrate('0.4.81', (db) => {
    db.transaction((tx) => {
      tx.execMulti({ sql: createTradeRoutesTable });

      tx.exec({
        sql: `
          INSERT INTO trade_routes (
            id,
            village_id,
            target_village_id,
            resources,
            interval,
            starts_at
          )
          SELECT
            id,
            village_id,
            JSON_EXTRACT(meta, '$.targetVillageId'),
            JSON_EXTRACT(meta, '$.resources'),
            JSON_EXTRACT(meta, '$.interval'),
            starts_at
          FROM events
          WHERE type = 'tradeRoute';
        `,
      });

      tx.exec({
        sql: `
          UPDATE events
          SET meta = JSON_OBJECT('tradeRouteId', id)
          WHERE type = 'tradeRoute';
        `,
      });

      const hasPlayerId = (table: string) =>
        tx.selectValue({
          sql: "SELECT COUNT(*) FROM pragma_table_info($table) WHERE name = 'player_id';",
          bind: { $table: table },
          schema: z.number(),
        });

      if (!hasPlayerId('quests')) {
        tx.execMulti({
          sql: `
            ALTER TABLE quests RENAME TO legacy_quests;
            DROP INDEX IF EXISTS idx_quests_village_id_notnull;
            DROP INDEX IF EXISTS idx_quests_quest_id;
          `,
        });

        tx.execMulti({ sql: createQuestsTable });

        tx.exec({
          sql: `
            INSERT INTO quests (id, quest_id, player_id, completed_at, collected_at, village_id)
            SELECT q.id, q.quest_id, COALESCE(v.player_id, $player_id), q.completed_at, q.collected_at, q.village_id
            FROM legacy_quests q LEFT JOIN villages v ON v.id = q.village_id;
            `,
          bind: { $player_id: PLAYER_ID },
        });

        tx.exec({ sql: 'DROP TABLE legacy_quests;' });
      }

      if (!hasPlayerId('faction_reputation')) {
        tx.exec({
          sql: 'ALTER TABLE faction_reputation RENAME TO legacy_faction_reputation;',
        });

        tx.execMulti({ sql: createFactionReputationTable });

        tx.exec({
          sql: `
            INSERT INTO faction_reputation (player_id, target_faction_id, reputation)
            SELECT p.id, fr.target_faction_id, fr.reputation
            FROM legacy_faction_reputation fr JOIN players p ON p.faction_id = fr.source_faction_id;
          `,
        });

        tx.exec({ sql: 'DROP TABLE legacy_faction_reputation;' });
      }

      setupGlobalWriteTriggers(tx);
    });
  });

  migrate('0.4.82', (db) => {
    db.transaction((tx) => {
      // Older migrations create trade_routes using the current schema.
      const hasMinimumResources = tx.selectValue({
        sql: "SELECT COUNT(*) FROM pragma_table_info('trade_routes') WHERE name = 'minimum_resources';",
        schema: z.number(),
      });

      if (!hasMinimumResources) {
        tx.exec({
          sql: `ALTER TABLE trade_routes ADD COLUMN minimum_resources TEXT NOT NULL
          DEFAULT '{"wood":0,"clay":0,"iron":0,"wheat":0}' CHECK (JSON_VALID(minimum_resources));`,
        });
      }

      const hasMinimumMerchants = tx.selectValue({
        sql: "SELECT COUNT(*) FROM pragma_table_info('trade_routes') WHERE name = 'minimum_merchants';",
        schema: z.number(),
      });

      if (!hasMinimumMerchants) {
        tx.exec({
          sql: 'ALTER TABLE trade_routes ADD COLUMN minimum_merchants INTEGER NOT NULL DEFAULT 0 CHECK (minimum_merchants >= 0);',
        });
      }
    });
  });

  migrate('0.4.83', (db) => {
    db.transaction((tx) => {
      tx.exec({
        sql: 'DROP TRIGGER IF EXISTS battle_report_units_create_wounded_troops_after_insert;',
      });

      tx.exec({
        sql: 'DROP TRIGGER IF EXISTS reports_delete_details_before_delete;',
      });

      tx.exec({ sql: 'DROP TABLE battle_report_units;' });
      tx.exec({ sql: 'DROP TABLE battle_report_buildings;' });

      tx.execMulti({ sql: createBattleReportUnitsTable });

      tx.execMulti({ sql: createVillageConquestFailureReasonIdsTable });
      villageConquestFailureReasonIdsSeeder(tx);

      tx.execMulti({ sql: createOasisCaptureFailureReasonIdsTable });
      oasisCaptureFailureReasonIdsSeeder(tx);

      tx.exec({ sql: 'DROP TABLE battle_reports;' });

      tx.execMulti({ sql: createBattleReportsTable });

      tx.execMulti({ sql: createBattleReportBuildingsTable });
      tx.exec({
        sql: 'CREATE INDEX idx_battle_report_buildings_battle ON battle_report_buildings(battle_id);',
      });

      tx.execMulti({ sql: createBattleReportHeroesTable });
      tx.execMulti({ sql: createBattleReportConsumablesTable });
      tx.execMulti({ sql: createBattleReportConquestsTable });
      tx.execMulti({ sql: createBattleReportRescuesTable });
      tx.execMulti({ sql: createBattleReportRescuedUnitsTable });
      tx.execMulti({ sql: createBattleReportCapturedAnimalsTable });
      tx.execMulti({ sql: createBattleReportStolenItemsTable });
      tx.execMulti({ sql: createReportDeleteTriggers });

      tx.execMulti({ sql: createReportGenerationSettingsTable });

      setupGlobalWriteTriggers(tx);
    });
  });

  // If all migrations passed, bump it to current version
  if (databaseVersion !== targetDatabaseVersion) {
    database.exec({
      sql: `PRAGMA user_version=${targetDatabaseVersion};`,
    });
  }

  database.exec({
    sql: 'VACUUM;',
  });
};
