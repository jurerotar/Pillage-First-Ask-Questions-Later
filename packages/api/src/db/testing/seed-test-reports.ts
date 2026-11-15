import { z } from 'zod';
import {
  type ReportListingFilter,
  type ReportScope,
  reportFilterNameByScope,
} from '@pillage-first/types/dtos/report';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import {
  type CreateNewBattleReport,
  insertBattleReport,
  type insertScoutingReport,
} from '../../utils/report';
import { prepareTestDatabase } from './prepare-test-database';

export const setActiveReportFilters = (
  database: Awaited<ReturnType<typeof prepareTestDatabase>>,
  filters: ReportListingFilter[],
  scope: ReportScope = 'global',
): void => {
  const filterName = reportFilterNameByScope[scope];

  database.transaction((tx) => {
    tx.exec({
      sql: `
        DELETE FROM filters
        WHERE name = $name;
      `,
      bind: { $name: filterName },
    });

    tx.exec({
      sql: `
        INSERT INTO filters (player_id, name, filter)
        SELECT 1, $name, value
        FROM JSON_EACH($filters);
      `,
      bind: {
        $filters: JSON.stringify(filters),
        $name: filterName,
      },
    });
  });
};

export const prepareReportsTestDatabase = async () => {
  const database = await prepareTestDatabase();

  database.exec({
    sql: 'DELETE FROM reports;',
  });

  database.execMulti({
    sql: `
      INSERT INTO reports (id, village_id, timestamp, type_id, report_outcome_id)
      VALUES
        (1, (SELECT id FROM villages ORDER BY id LIMIT 1), 1000, (SELECT id FROM report_type_ids WHERE report_type = 'battle'), (SELECT id FROM report_outcome_ids WHERE report_outcome = 'attackerNoLoss')),
        (2, (SELECT id FROM villages ORDER BY id LIMIT 1), 2000, (SELECT id FROM report_type_ids WHERE report_type = 'adventure'), (SELECT id FROM report_outcome_ids WHERE report_outcome = 'heroAdventure')),
        (3, (SELECT id FROM villages ORDER BY id LIMIT 1), 3000, (SELECT id FROM report_type_ids WHERE report_type = 'movement'), (SELECT id FROM report_outcome_ids WHERE report_outcome = 'troopMovement')),
        (4, (SELECT id FROM villages ORDER BY id LIMIT 1), 4000, (SELECT id FROM report_type_ids WHERE report_type = 'trade'), (SELECT id FROM report_outcome_ids WHERE report_outcome = 'outgoingMerchantsArrived')),
        (5, (SELECT id FROM villages ORDER BY id LIMIT 1), 5000, (SELECT id FROM report_type_ids WHERE report_type = 'huntingParty'), (SELECT id FROM report_outcome_ids WHERE report_outcome = 'huntingParty')),
        (6, (SELECT id FROM villages ORDER BY id LIMIT 1), 6000, (SELECT id FROM report_type_ids WHERE report_type = 'gatheringExpedition'), (SELECT id FROM report_outcome_ids WHERE report_outcome = 'gatheringExpedition'));
    `,
  });

  database.exec({
    sql: `
      INSERT INTO report_tags (report_id, report_tag_id)
      VALUES
        (1, (SELECT id FROM report_tag_ids WHERE tag = 'read')),
        (2, (SELECT id FROM report_tag_ids WHERE tag = 'archived'));
    `,
  });

  database.exec({
    sql: `
      INSERT INTO battle_reports (
        id, report_id, origin_tile_id, target_tile_id, is_raid,
        loot_wood, loot_clay, loot_iron, loot_wheat,
        attacker_points, defender_points, village_destroyed
      ) VALUES (
        1, 1,
        (SELECT tile_id FROM villages ORDER BY id LIMIT 1),
        (SELECT tile_id FROM villages ORDER BY id LIMIT 1 OFFSET 1),
        0, 10, 20, 30, 40, 100, 50, 0
      );
    `,
  });

  database.exec({
    sql: `
      INSERT INTO battle_report_participants (id, battle_id, player_id, tile_id)
      SELECT 1, 1, player_id, tile_id FROM villages ORDER BY id LIMIT 1;
    `,
  });

  database.exec({
    sql: `
      INSERT INTO battle_report_participants (id, battle_id, player_id, tile_id)
      SELECT 2, 1, player_id, tile_id FROM villages ORDER BY id LIMIT 1 OFFSET 1;
    `,
  });

  database.exec({
    sql: `
      INSERT INTO battle_report_units (battle_participant_id, unit_id, amount_before, amount_after, amount_hospitalized, amount_imprisoned, amount_bandaged, amount_consumed)
      VALUES
        (1, (SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE'), 10, 8, 0, 0, 0, 0),
        (2, (SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE'), 5, 0, 0, 0, 0, 0);
    `,
  });

  database.exec({
    sql: `
      INSERT INTO battle_report_buildings (
        battle_id,
        building_id,
        field_id,
        targeting,
        outcome,
        level_before,
        level_after
      )
      VALUES
        (1, (SELECT id FROM building_ids WHERE building = 'RALLY_POINT'), 39, 'random', 'damaged', 10, 4),
        (1, (SELECT id FROM building_ids WHERE building = 'WHEAT_FIELD'), 1, 'random', 'destroyed', 8, 0);
    `,
  });

  database.exec({
    sql: `
      INSERT INTO hero_adventure_reports (
        report_id, adventure_id, item_id, item_amount, health_before, health_after
      ) VALUES (2, 1, NULL, NULL, 100, 95);
    `,
  });

  database.exec({
    sql: `
      INSERT INTO movement_reports (id, report_id, origin_tile_id, target_tile_id, movement_type)
      VALUES (
        1, 3,
        (SELECT tile_id FROM villages ORDER BY id LIMIT 1),
        (SELECT tile_id FROM villages ORDER BY id LIMIT 1 OFFSET 1),
        'reinforcement'
      );
    `,
  });

  database.exec({
    sql: `
      INSERT INTO movement_report_units (movement_report_id, unit_id, amount)
      VALUES (1, (SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE'), 10);
    `,
  });

  database.exec({
    sql: `
      INSERT INTO trade_reports (
        id, report_id, origin_tile_id, target_tile_id, wood, clay, iron, wheat
      ) VALUES (
        1, 4,
        (SELECT tile_id FROM villages ORDER BY id LIMIT 1),
        (SELECT tile_id FROM villages ORDER BY id LIMIT 1 OFFSET 1),
        100, 200, 300, 400
      );
    `,
  });

  database.exec({
    sql: `
      INSERT INTO hunting_party_reports (id, report_id, village_tile_id)
      VALUES (1, 5, (SELECT tile_id FROM villages ORDER BY id LIMIT 1));
    `,
  });

  database.exec({
    sql: `
      INSERT INTO hunting_party_report_units (hunting_party_report_id, unit_id, amount)
      VALUES (1, (SELECT id FROM unit_ids WHERE unit = 'RAT'), 3);
    `,
  });

  database.exec({
    sql: `
      INSERT INTO gathering_expedition_reports (
        id, report_id, village_tile_id, tribe_id,
        loot_wood, loot_clay, loot_iron, loot_wheat
      ) VALUES (
        1, 6,
        (SELECT tile_id FROM villages ORDER BY id LIMIT 1),
        (SELECT p.tribe_id FROM villages v JOIN players p ON p.id = v.player_id ORDER BY v.id LIMIT 1),
        40, 30, 20, 10
      );
    `,
  });

  database.exec({
    sql: `
      INSERT INTO gathering_expedition_report_units (
        gathering_expedition_report_id, unit_id, amount
      ) VALUES (1, (SELECT id FROM unit_ids WHERE unit = 'LEGIONNAIRE'), 4);
    `,
  });

  return database;
};

export const createScoutingIntelligenceFixture = (database: DbFacade) => {
  const villages = database.selectObjects({
    sql: `SELECT v.id, v.tile_id, v.player_id, v.name AS village_name,
      p.name AS player_name, p.slug AS player_slug, t.x, t.y
      FROM villages v JOIN players p ON p.id = v.player_id
      JOIN tribe_ids ti ON ti.id = p.tribe_id JOIN tiles t ON t.id = v.tile_id
      WHERE ti.tribe = 'romans' ORDER BY v.id LIMIT 4;`,
    schema: z.strictObject({
      id: z.int(),
      tile_id: z.int(),
      player_id: z.int(),
      village_name: z.string(),
      player_name: z.string(),
      player_slug: z.string(),
      x: z.int(),
      y: z.int(),
    }),
  });

  if (villages.length !== 4) {
    throw new Error('Scouting fixtures require four Roman villages');
  }

  const [origin, target, firstReinforcement, secondReinforcement] = villages;
  const input: Parameters<typeof insertScoutingReport>[1] = {
    villageId: origin.id,
    timestamp: 7000,
    outcome: 'scoutAttackerSomeLoss',
    originTileId: origin.tile_id,
    targetTileId: target.tile_id,
    perspective: 'attacker',
    successful: true,
    target: 'resources',
    attacker: {
      tribe: 'romans',
      units: [{ unitId: 'ROMAN_SCOUT', amountBefore: 10, amountAfter: 8 }],
    },
    defender: {
      tribe: 'romans',
      units: [{ unitId: 'ROMAN_SCOUT', amount: 20 }],
      reinforcements: [
        {
          tileId: firstReinforcement.tile_id,
          tribe: 'romans',
          units: [
            { unitId: 'LEGIONNAIRE', amount: 30 },
            { unitId: 'PRAETORIAN', amount: 15 },
          ],
        },
        {
          tileId: secondReinforcement.tile_id,
          tribe: 'romans',
          units: [{ unitId: 'LEGIONNAIRE', amount: 40 }],
        },
      ],
    },
    resources: { wood: 0, clay: 20, iron: 30, wheat: 40 },
    itemId: 1022,
    itemAmount: 1,
  };

  return { input, origin, target, firstReinforcement, secondReinforcement };
};

export const createCombatOutcomeReport = (database: DbFacade) => {
  const [origin, target, reinforcement] = database.selectObjects({
    sql: 'SELECT id, tile_id, player_id FROM villages ORDER BY id LIMIT 3;',
    schema: z.strictObject({
      id: z.int(),
      tile_id: z.int(),
      player_id: z.int(),
    }),
  });
  const input: CreateNewBattleReport = {
    villageId: origin.id,
    timestamp: 5000,
    outcome: 'attackerSomeLoss',
    originTileId: origin.tile_id,
    targetTileId: target.tile_id,
    isRaid: false,
    loot: [10, 20, 30, 40],
    attackerPoints: 50,
    defenderPoints: 20,
    loyaltyBefore: 20.5,
    loyaltyAfter: 0,
    conquest: { target: 'village', succeeded: true, failureReason: null },
    villageDestroyed: false,
    trapsDestroyed: 12,
    siegeResults: [
      {
        fieldId: 20,
        requestedBuildingId: 'WAREHOUSE',
        buildingId: 'WAREHOUSE',
        targeting: 'selected',
        outcome: 'damaged',
        reason: null,
        levelBefore: 20,
        levelAfter: 12,
      },
    ],
    rescuedUnits: [
      {
        playerId: reinforcement.player_id,
        homeTileId: reinforcement.tile_id,
        unitId: 'LEGIONNAIRE',
        amountFreed: 20,
        amountDied: 5,
      },
    ],
    capturedAnimals: [{ unitId: 'RAT', amount: 3 }],
    stolenItems: [
      { itemId: 10001, amount: 1 },
      { itemId: 1021, amount: 3 },
    ],
    attacker: {
      playerId: origin.player_id,
      tileId: origin.tile_id,
      units: [
        {
          unitId: 'LEGIONNAIRE',
          amountBefore: 100,
          amountAfter: 50,
          amountHospitalized: 10,
          amountImprisoned: 5,
          amountBandaged: 8,
          amountConsumed: 0,
        },
        {
          unitId: 'ROMAN_CHIEF',
          amountBefore: 1,
          amountAfter: 0,
          amountHospitalized: 0,
          amountImprisoned: 0,
          amountBandaged: 0,
          amountConsumed: 1,
        },
      ],
      hero: {
        heroId: 7001,
        healthBefore: 100,
        healthAfter: 50,
        experienceGained: 123,
        consumables: [{ itemId: 1023, amount: 3 }],
      },
    },
    defender: {
      playerId: target.player_id,
      tileId: target.tile_id,
      units: [],
      hero: {
        heroId: 7002,
        healthBefore: 50,
        healthAfter: 0,
        experienceGained: 24,
        consumables: [],
      },
    },
    reinforcements: [
      {
        playerId: reinforcement.player_id,
        tileId: reinforcement.tile_id,
        units: [],
        hero: {
          heroId: 7003,
          healthBefore: 100,
          healthAfter: 0,
          experienceGained: 45,
          consumables: [{ itemId: 1021, amount: 2 }],
        },
      },
    ],
  };

  const reportId = insertBattleReport(database, input);

  if (reportId === undefined) {
    throw new Error('Expected battle report generation to be enabled');
  }

  return { input, reportId };
};
