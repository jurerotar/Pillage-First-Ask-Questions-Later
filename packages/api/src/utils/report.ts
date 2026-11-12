import { z } from 'zod';
import {
  type BattleUnit,
  battleHeroOutcomeSchema,
  battleOutcomeSchema,
  battleSiegeResultSchema,
  battleUnitSchema,
} from '@pillage-first/types/models/battle';
import type { Building } from '@pillage-first/types/models/building';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import type {
  AdventureReport,
  BaseReport,
  ReportOutcome,
  ScheduledConstructionCancellationReason,
  ScheduledConstructionCancellationReasonDetail,
} from '@pillage-first/types/models/report';
import { battleResultIdSchema } from '@pillage-first/types/models/report';
import type { Resources } from '@pillage-first/types/models/resource';
import { resourceBundleSchema } from '@pillage-first/types/models/resource';
import { tileIdSchema } from '@pillage-first/types/models/tile';
import type { Tribe } from '@pillage-first/types/models/tribe';
import type { UnitId } from '@pillage-first/types/models/unit';
import type { DbFacade } from '@pillage-first/utils/facades/database';

export type CreateNewReport = Pick<
  BaseReport,
  'villageId' | 'timestamp' | 'type' | 'outcome' | 'tags'
>;

type CreateNewTradeReport = Pick<CreateNewReport, 'villageId' | 'timestamp'> & {
  outcome: Extract<
    ReportOutcome,
    'incomingMerchantsArrived' | 'outgoingMerchantsArrived'
  >;
  originTileId: number;
  targetTileId: number;
  resources: Resources;
};

export type CreateNewAdventureReport = Pick<
  CreateNewReport,
  'villageId' | 'timestamp'
> &
  Pick<
    AdventureReport,
    'adventureId' | 'itemId' | 'itemAmount' | 'healthBefore' | 'healthAfter'
  >;

export type CreateNewGatheringExpeditionReport = Pick<
  CreateNewReport,
  'villageId' | 'timestamp'
> & {
  villageTileId: number;
  tribeId: number;
  loot: number[];
  units: { unitId: UnitId; amount: number }[];
};

export type CreateNewHuntingPartyReport = Pick<
  CreateNewReport,
  'villageId' | 'timestamp'
> & {
  villageTileId: number;
  unitId: UnitId;
  amount: number;
};

export type CreateNewUnitResearchReport = Pick<
  CreateNewReport,
  'villageId' | 'timestamp'
> & {
  unitId: UnitId;
};

export type CreateNewUnitImprovementReport = Pick<
  CreateNewReport,
  'villageId' | 'timestamp'
> & {
  unitId: UnitId;
  level: number;
};

export type CreateNewVillageFoundedReport = Pick<
  CreateNewReport,
  'villageId' | 'timestamp'
> & {
  originTileId: number;
  targetTileId: number;
};

export type CreateNewScheduledConstructionCancellationReport = Pick<
  CreateNewReport,
  'villageId' | 'timestamp'
> & {
  buildingId: Building['id'];
  buildingFieldId: BuildingField['id'];
  level: number;
  reason: ScheduledConstructionCancellationReason;
  reasonDetail: ScheduledConstructionCancellationReasonDetail;
};

type CreateNewScoutingReport = Pick<
  CreateNewReport,
  'villageId' | 'timestamp' | 'outcome'
> & {
  originTileId: number;
  targetTileId: number;
  perspective: 'attacker' | 'defender';
  successful: boolean;
  target: 'resources' | 'defensiveStructures';
  attacker: {
    tribe: Tribe;
    units: {
      unitId: UnitId;
      amountBefore: number;
      amountAfter: number;
    }[];
  };
  defender: {
    tribe: Tribe;
    units: { unitId: UnitId; amount: number }[];
    reinforcements?: {
      tileId: number;
      tribe: Tribe;
      units: { unitId: UnitId; amount: number }[];
    }[];
  };
  resources?: Resources;
  itemId?: number | null;
  itemAmount?: number | null;
  defensiveStructures?: { buildingId: Building['id']; level: number }[];
};

type CreateNewBattleReportUnit = BattleUnit;

const battleReportParticipantInputSchema = z.strictObject({
  playerId: z.int().positive().nullable(),
  tileId: tileIdSchema,
  units: z.array(battleUnitSchema),
  hero: battleHeroOutcomeSchema.nullable(),
});

const createNewBattleReportSchema = z
  .strictObject({
    villageId: z.int().positive(),
    timestamp: z.int().nonnegative(),
    outcome: battleResultIdSchema,
    originTileId: tileIdSchema,
    targetTileId: tileIdSchema,
    isRaid: z.boolean(),
    loot: resourceBundleSchema,
    attackerPoints: z.int().nonnegative(),
    defenderPoints: z.int().nonnegative(),
    loyaltyBefore: battleOutcomeSchema.shape.loyaltyBefore,
    loyaltyAfter: battleOutcomeSchema.shape.loyaltyAfter,
    conquest: battleOutcomeSchema.shape.conquest,
    villageDestroyed: z.boolean(),
    trapsDestroyed: z.int().nonnegative(),
    rescuedUnits: battleOutcomeSchema.shape.rescuedUnits,
    capturedAnimals: battleOutcomeSchema.shape.capturedAnimals,
    stolenItems: battleOutcomeSchema.shape.stolenItems,
    attacker: battleReportParticipantInputSchema,
    defender: battleReportParticipantInputSchema,
    reinforcements: z.array(battleReportParticipantInputSchema),
    siegeResults: z.array(battleSiegeResultSchema),
  })
  .refine(
    ({ originTileId, targetTileId, attacker, defender, reinforcements }) =>
      originTileId !== targetTileId &&
      attacker.tileId === originTileId &&
      defender.tileId === targetTileId &&
      reinforcements.every(
        ({ tileId }) => tileId !== originTileId && tileId !== targetTileId,
      ) &&
      new Set(reinforcements.map(({ tileId }) => tileId)).size ===
        reinforcements.length,
    {
      message:
        'Battle participants must match distinct origin, target, and reinforcement villages',
    },
  );

export type CreateNewBattleReport = z.infer<typeof createNewBattleReportSchema>;

export const insertReport = (
  database: DbFacade,
  report: CreateNewReport,
): number => {
  const reportId = database.selectValue({
    sql: `
      INSERT INTO
        reports (village_id, timestamp, type_id, report_outcome_id)
      VALUES
        ($village_id, $timestamp, (
          SELECT
            id
          FROM
            report_type_ids
          WHERE
            report_type = $type
          ), (
           SELECT
             id
           FROM
             report_outcome_ids
           WHERE
             report_outcome = $outcome
           ))
      RETURNING id;
    `,
    bind: {
      $village_id: report.villageId,
      $timestamp: report.timestamp,
      $type: report.type,
      $outcome: report.outcome,
    },
    schema: z.int(),
  })!;

  if (report.tags.length > 0) {
    database.exec({
      sql: `
        INSERT INTO
          report_tags (report_id, report_tag_id)
        SELECT $report_id, report_tag_ids.id
        FROM
          JSON_EACH($tags)
            JOIN report_tag_ids ON report_tag_ids.tag = json_each.value;
      `,
      bind: {
        $report_id: reportId,
        $tags: JSON.stringify(report.tags),
      },
    });
  }

  return reportId;
};

export const insertAdventureReport = (
  database: DbFacade,
  report: CreateNewAdventureReport,
): number => {
  const reportId = insertReport(database, {
    villageId: report.villageId,
    timestamp: report.timestamp,
    type: 'adventure',
    outcome: 'heroAdventure',
    tags: [],
  });

  database.exec({
    sql: `
      INSERT INTO hero_adventure_reports (
        report_id,
        adventure_id,
        item_id,
        item_amount,
        health_before,
        health_after
      )
      VALUES (
        $report_id,
        $adventure_id,
        $item_id,
        $item_amount,
        $health_before,
        $health_after
      );
    `,
    bind: {
      $report_id: reportId,
      $adventure_id: report.adventureId,
      $item_id: report.itemId,
      $item_amount: report.itemAmount,
      $health_before: report.healthBefore,
      $health_after: report.healthAfter,
    },
  });

  return reportId;
};

export const insertGatheringExpeditionReport = (
  database: DbFacade,
  report: CreateNewGatheringExpeditionReport,
): number => {
  const reportId = insertReport(database, {
    villageId: report.villageId,
    timestamp: report.timestamp,
    type: 'gatheringExpedition',
    outcome: 'gatheringExpedition',
    tags: [],
  });

  const gatheringExpeditionReportId = database.selectValue({
    sql: `
      INSERT INTO gathering_expedition_reports (
        report_id,
        village_tile_id,
        tribe_id,
        loot_wood,
        loot_clay,
        loot_iron,
        loot_wheat
      )
      VALUES (
        $report_id,
        $village_tile_id,
        $tribe_id,
        $loot_wood,
        $loot_clay,
        $loot_iron,
        $loot_wheat
      )
      RETURNING id;
    `,
    bind: {
      $report_id: reportId,
      $village_tile_id: report.villageTileId,
      $tribe_id: report.tribeId,
      $loot_wood: report.loot[0],
      $loot_clay: report.loot[1],
      $loot_iron: report.loot[2],
      $loot_wheat: report.loot[3],
    },
    schema: z.int(),
  })!;

  database.exec({
    sql: `
      INSERT INTO gathering_expedition_report_units (
        gathering_expedition_report_id,
        unit_id,
        amount
      )
      SELECT
        $report_detail_id,
        unit_ids.id,
        json_extract(unit.value, '$.amount')
      FROM
        json_each($units) AS unit
        JOIN unit_ids
          ON unit_ids.unit = json_extract(unit.value, '$.unitId');
    `,
    bind: {
      $report_detail_id: gatheringExpeditionReportId,
      $units: JSON.stringify(report.units),
    },
  });

  return reportId;
};

export const insertHuntingPartyReport = (
  database: DbFacade,
  report: CreateNewHuntingPartyReport,
): number => {
  const reportId = insertReport(database, {
    villageId: report.villageId,
    timestamp: report.timestamp,
    type: 'huntingParty',
    outcome: 'huntingParty',
    tags: [],
  });

  const huntingPartyReportId = database.selectValue({
    sql: `
      INSERT INTO hunting_party_reports (report_id, village_tile_id)
      VALUES ($report_id, $village_tile_id)
      RETURNING id;
    `,
    bind: {
      $report_id: reportId,
      $village_tile_id: report.villageTileId,
    },
    schema: z.int(),
  })!;

  database.exec({
    sql: `
      INSERT INTO hunting_party_report_units (
        hunting_party_report_id,
        unit_id,
        amount
      )
      SELECT $hunting_party_report_id, id, $amount
      FROM unit_ids
      WHERE unit = $unit_id;
    `,
    bind: {
      $hunting_party_report_id: huntingPartyReportId,
      $unit_id: report.unitId,
      $amount: report.amount,
    },
  });

  return reportId;
};

export const insertUnitResearchReport = (
  database: DbFacade,
  report: CreateNewUnitResearchReport,
): number => {
  const reportId = insertReport(database, {
    villageId: report.villageId,
    timestamp: report.timestamp,
    type: 'unitResearch',
    outcome: 'unitResearched',
    tags: [],
  });

  database.exec({
    sql: `
      INSERT INTO unit_research_reports (report_id, village_id, unit_id)
      SELECT $report_id, $village_id, id
      FROM unit_ids
      WHERE unit = $unit_id;
    `,
    bind: {
      $report_id: reportId,
      $village_id: report.villageId,
      $unit_id: report.unitId,
    },
  });

  return reportId;
};

export const insertUnitImprovementReport = (
  database: DbFacade,
  report: CreateNewUnitImprovementReport,
): number => {
  const reportId = insertReport(database, {
    villageId: report.villageId,
    timestamp: report.timestamp,
    type: 'unitImprovement',
    outcome: 'unitImproved',
    tags: [],
  });

  database.exec({
    sql: `
      INSERT INTO unit_improvement_reports (report_id, village_id, unit_id, level)
      SELECT $report_id, $village_id, id, $level
      FROM unit_ids
      WHERE unit = $unit_id;
    `,
    bind: {
      $report_id: reportId,
      $village_id: report.villageId,
      $unit_id: report.unitId,
      $level: report.level,
    },
  });

  return reportId;
};

export const insertVillageFoundedReport = (
  database: DbFacade,
  report: CreateNewVillageFoundedReport,
): number => {
  const reportId = insertReport(database, {
    villageId: report.villageId,
    timestamp: report.timestamp,
    type: 'villageFounded',
    outcome: 'villageFounded',
    tags: [],
  });

  database.exec({
    sql: `
      INSERT INTO village_founding_reports (
        report_id,
        origin_tile_id,
        target_tile_id
      )
      VALUES (
        $report_id,
        $origin_tile_id,
        $target_tile_id
      );
    `,
    bind: {
      $report_id: reportId,
      $origin_tile_id: report.originTileId,
      $target_tile_id: report.targetTileId,
    },
  });

  return reportId;
};

export const insertScheduledConstructionCancellationReport = (
  database: DbFacade,
  report: CreateNewScheduledConstructionCancellationReport,
): number => {
  const reportId = insertReport(database, {
    villageId: report.villageId,
    timestamp: report.timestamp,
    type: 'scheduledConstructionCancellation',
    outcome: 'scheduledConstructionCancelled',
    tags: [],
  });

  database.exec({
    sql: `
      INSERT INTO scheduled_construction_cancellation_reports (
        report_id,
        village_id,
        building_id,
        field_id,
        level,
        reason,
        reason_detail_json
      )
      SELECT
        $report_id,
        $village_id,
        id,
        $field_id,
        $level,
        $reason,
        $reason_detail_json
      FROM building_ids
      WHERE building = $building_id;
    `,
    bind: {
      $report_id: reportId,
      $village_id: report.villageId,
      $building_id: report.buildingId,
      $field_id: report.buildingFieldId,
      $level: report.level,
      $reason: report.reason,
      $reason_detail_json: JSON.stringify(report.reasonDetail),
    },
  });

  return reportId;
};

export const insertMovementReport = (
  database: DbFacade,
  {
    villageId,
    resolvesAt,
    originTileId,
    targetTileId,
    movementType,
    troops,
  }: Pick<
    GameEvent<'troopMovementRelocation'>,
    'villageId' | 'resolvesAt' | 'originTileId' | 'targetTileId' | 'troops'
  > & { movementType: 'reinforcement' | 'relocation' },
) => {
  const resolvedOriginTileId =
    originTileId ??
    database.selectValue({
      sql: 'SELECT tile_id FROM villages WHERE id = $village_id;',
      bind: { $village_id: villageId },
      schema: tileIdSchema,
    })!;

  const reportId = insertReport(database, {
    villageId,
    timestamp: resolvesAt,
    type: 'movement',
    outcome: 'troopMovement',
    tags: [],
  });

  const movementReportId = database.selectValue({
    sql: `
      INSERT INTO
        movement_reports (report_id, origin_tile_id, target_tile_id, movement_type)
      VALUES
        ($report_id, $origin_tile_id, $target_tile_id, $movement_type)
      RETURNING id;
    `,
    bind: {
      $report_id: reportId,
      $origin_tile_id: resolvedOriginTileId,
      $target_tile_id: targetTileId,
      $movement_type: movementType,
    },
    schema: z.int(),
  })!;

  database.exec({
    sql: `
      INSERT INTO
        movement_report_units (movement_report_id, unit_id, amount)
      SELECT
        $movement_report_id,
        unit_ids.id,
        JSON_EXTRACT(troop.value, '$.amount')
      FROM
        JSON_EACH($troops) AS troop
          JOIN unit_ids
               ON unit_ids.unit = JSON_EXTRACT(troop.value, '$.unitId');
    `,
    bind: {
      $movement_report_id: movementReportId,
      $troops: JSON.stringify(troops),
    },
  });
};

export const insertBattleReport = (
  database: DbFacade,
  report: CreateNewBattleReport,
): number => {
  // Event resolution may already be in a transaction.
  database.exec({ sql: 'SAVEPOINT insert_battle_report;' });

  try {
    const reportId = persistBattleReport(
      database,
      createNewBattleReportSchema.parse(report),
    );
    database.exec({ sql: 'RELEASE insert_battle_report;' });

    return reportId;
  } catch (error) {
    database.exec({ sql: 'ROLLBACK TO insert_battle_report;' });
    database.exec({ sql: 'RELEASE insert_battle_report;' });

    throw error;
  }
};

const persistBattleReport = (
  database: DbFacade,
  report: CreateNewBattleReport,
): number => {
  const resolvedOutcome = battleOutcomeSchema.parse({
    loot: report.loot,
    totalCarryCapacity: 0,
    loyaltyBefore: report.loyaltyBefore,
    loyaltyAfter: report.loyaltyAfter,
    conquest: report.conquest,
    villageDestroyed: report.villageDestroyed,
    trapsDestroyed: report.trapsDestroyed,
    rescuedUnits: report.rescuedUnits,
    capturedAnimals: report.capturedAnimals,
    stolenItems: report.stolenItems,
  });

  if (resolvedOutcome.conquest !== null) {
    const target = database.selectValue({
      sql: `SELECT CASE WHEN tt.type = 'oasis' THEN 'oasis' ELSE 'village' END
        FROM tiles t JOIN tile_type_ids tt ON tt.id = t.type_id WHERE t.id = $tile_id;`,
      bind: { $tile_id: report.targetTileId },
      schema: z.enum(['village', 'oasis']),
    });

    if (target !== resolvedOutcome.conquest.target) {
      throw new Error('Conquest target must match the target tile type');
    }
  }

  const reportId = insertReport(database, {
    villageId: report.villageId,
    timestamp: report.timestamp,
    type: 'battle',
    outcome: report.outcome,
    tags: [],
  });

  const battleReportId = database.selectValue({
    sql: `
      INSERT INTO battle_reports (
        report_id,
        origin_tile_id,
        target_tile_id,
        is_raid,
        loot_wood,
        loot_clay,
        loot_iron,
        loot_wheat,
        attacker_points,
        defender_points,
        village_destroyed
      )
      VALUES (
        $report_id,
        $origin_tile_id,
        $target_tile_id,
        $is_raid,
        $loot_wood,
        $loot_clay,
        $loot_iron,
        $loot_wheat,
        $attacker_points,
        $defender_points,
        $village_destroyed
      )
      RETURNING id;
    `,
    bind: {
      $report_id: reportId,
      $origin_tile_id: report.originTileId,
      $target_tile_id: report.targetTileId,
      $is_raid: report.isRaid ? 1 : 0,
      $loot_wood: report.loot[0],
      $loot_clay: report.loot[1],
      $loot_iron: report.loot[2],
      $loot_wheat: report.loot[3],
      $attacker_points: report.attackerPoints,
      $defender_points: report.defenderPoints,
      $village_destroyed: Number(resolvedOutcome.villageDestroyed),
    },
    schema: z.int(),
  })!;

  if (resolvedOutcome.conquest !== null) {
    database.exec({
      sql: `INSERT INTO battle_report_conquests (
          battle_id, target, loyalty_before, loyalty_after, succeeded,
          village_conquest_failure_reason_id, oasis_capture_failure_reason_id
        ) VALUES (
          $battle_id, $target, $loyalty_before, $loyalty_after, $succeeded,
          (SELECT id FROM village_conquest_failure_reason_ids WHERE reason = $village_failure_reason),
          (SELECT id FROM oasis_capture_failure_reason_ids WHERE reason = $oasis_failure_reason)
        );`,
      bind: {
        $battle_id: battleReportId,
        $target: resolvedOutcome.conquest.target,
        $loyalty_before: resolvedOutcome.loyaltyBefore,
        $loyalty_after: resolvedOutcome.loyaltyAfter,
        $succeeded: Number(resolvedOutcome.conquest.succeeded),
        $village_failure_reason:
          resolvedOutcome.conquest.target === 'village'
            ? resolvedOutcome.conquest.failureReason
            : null,
        $oasis_failure_reason:
          resolvedOutcome.conquest.target === 'oasis'
            ? resolvedOutcome.conquest.failureReason
            : null,
      },
    });
  } else if (
    resolvedOutcome.loyaltyBefore !== null ||
    resolvedOutcome.loyaltyAfter !== null
  ) {
    throw new Error('Loyalty changes require a conquest attempt');
  }

  if (
    resolvedOutcome.trapsDestroyed > 0 ||
    resolvedOutcome.rescuedUnits.length > 0
  ) {
    database.exec({
      sql: 'INSERT INTO battle_report_rescues (battle_id, traps_destroyed) VALUES ($battle_id, $traps_destroyed);',
      bind: {
        $battle_id: battleReportId,
        $traps_destroyed: resolvedOutcome.trapsDestroyed,
      },
    });
  }

  const participants = [
    report.attacker,
    report.defender,
    ...report.reinforcements,
  ];

  const firstBattleParticipantId = database.selectValue({
    sql: 'SELECT COALESCE(MAX(id), 0) + 1 FROM battle_report_participants;',
    schema: z.int(),
  })!;

  const participantRows = participants.map((participant, index) => ({
    id: firstBattleParticipantId + index,
    playerId: participant.playerId,
    tileId: participant.tileId,
  }));

  database.exec({
    sql: `
      INSERT INTO battle_report_participants (id, battle_id, player_id, tile_id)
      SELECT
        JSON_EXTRACT(participant.value, '$.id'),
        $battle_id,
        JSON_EXTRACT(participant.value, '$.playerId'),
        JSON_EXTRACT(participant.value, '$.tileId')
      FROM jsonb_each($participants) AS participant;
    `,
    bind: {
      $battle_id: battleReportId,
      $participants: JSON.stringify(participantRows),
    },
  });

  const unitRows: (CreateNewBattleReportUnit & {
    battleParticipantId: number;
  })[] = [];

  for (let index = 0; index < participants.length; index += 1) {
    const participant = participants[index];
    const battleParticipantId = firstBattleParticipantId + index;

    for (const unit of participant.units) {
      unitRows.push({
        ...battleUnitSchema.parse(unit),
        battleParticipantId,
      });
    }
  }

  if (unitRows.length > 0) {
    database.exec({
      sql: `
        INSERT INTO battle_report_units (
          battle_participant_id,
          unit_id,
          amount_before,
          amount_after,
          amount_hospitalized,
          amount_imprisoned,
          amount_bandaged,
          amount_consumed
        )
        SELECT
          JSON_EXTRACT(unit.value, '$.battleParticipantId'),
          unit_ids.id,
          SUM(JSON_EXTRACT(unit.value, '$.amountBefore')),
          SUM(JSON_EXTRACT(unit.value, '$.amountAfter')),
          SUM(JSON_EXTRACT(unit.value, '$.amountHospitalized')),
          SUM(JSON_EXTRACT(unit.value, '$.amountImprisoned')),
          SUM(JSON_EXTRACT(unit.value, '$.amountBandaged')),
          SUM(JSON_EXTRACT(unit.value, '$.amountConsumed'))
        FROM
          jsonb_each($units) AS unit
          JOIN unit_ids
            ON unit_ids.unit = JSON_EXTRACT(unit.value, '$.unitId')
        GROUP BY
          JSON_EXTRACT(unit.value, '$.battleParticipantId'),
          unit_ids.id;
      `,
      bind: {
        $units: JSON.stringify(unitRows),
      },
    });
  }

  const siegeResults = report.siegeResults.map((result) =>
    battleSiegeResultSchema.parse(result),
  );

  if (siegeResults.length > 0) {
    database.exec({
      sql: `
        INSERT INTO battle_report_buildings (
          battle_id,
          building_id,
          field_id,
          requested_building_id,
          targeting,
          outcome,
          reason,
          level_before,
          level_after
        )
        SELECT
          $battle_id,
          building_ids.id,
          JSON_EXTRACT(building.value, '$.fieldId'),
          requested.id,
          JSON_EXTRACT(building.value, '$.targeting'),
          JSON_EXTRACT(building.value, '$.outcome'),
          JSON_EXTRACT(building.value, '$.reason'),
          JSON_EXTRACT(building.value, '$.levelBefore'),
          JSON_EXTRACT(building.value, '$.levelAfter')
        FROM
          JSON_EACH($siege_results) AS building
          LEFT JOIN building_ids
            ON building_ids.building = JSON_EXTRACT(
              building.value,
              '$.buildingId'
            )
          LEFT JOIN building_ids requested ON requested.building = JSON_EXTRACT(building.value, '$.requestedBuildingId')
        ORDER BY CAST(building.key AS INTEGER);
      `,
      bind: {
        $battle_id: battleReportId,
        $siege_results: JSON.stringify(siegeResults),
      },
    });
  }

  const heroes = participants.flatMap((participant, index) =>
    participant.hero
      ? [
          {
            battleParticipantId: firstBattleParticipantId + index,
            ...battleHeroOutcomeSchema.parse(participant.hero),
          },
        ]
      : [],
  );

  if (heroes.length > 0) {
    database.exec({
      sql: `INSERT INTO battle_report_heroes (battle_participant_id, hero_id, health_before, health_after, experience_gained)
        SELECT json_extract(hero.value, '$.battleParticipantId'), json_extract(hero.value, '$.heroId'),
          json_extract(hero.value, '$.healthBefore'), json_extract(hero.value, '$.healthAfter'),
          json_extract(hero.value, '$.experienceGained')
        FROM json_each($heroes) AS hero;`,
      bind: { $heroes: JSON.stringify(heroes) },
    });
    database.exec({
      sql: `INSERT INTO battle_report_consumables (battle_participant_id, item_id, amount)
        SELECT json_extract(hero.value, '$.battleParticipantId'), json_extract(item.value, '$.itemId'),
          SUM(json_extract(item.value, '$.amount'))
        FROM json_each($heroes) AS hero, json_each(hero.value, '$.consumables') AS item
        GROUP BY json_extract(hero.value, '$.battleParticipantId'), json_extract(item.value, '$.itemId');`,
      bind: { $heroes: JSON.stringify(heroes) },
    });
  }

  if (resolvedOutcome.rescuedUnits.length > 0) {
    database.exec({
      sql: `INSERT INTO battle_report_rescued_units (battle_id, player_id, home_tile_id, unit_id, amount_freed, amount_died)
        SELECT $battle_id, json_extract(unit.value, '$.playerId'), json_extract(unit.value, '$.homeTileId'), ui.id,
          SUM(json_extract(unit.value, '$.amountFreed')), SUM(json_extract(unit.value, '$.amountDied'))
        FROM json_each($units) AS unit JOIN unit_ids ui ON ui.unit = json_extract(unit.value, '$.unitId')
        GROUP BY json_extract(unit.value, '$.playerId'), json_extract(unit.value, '$.homeTileId'), ui.id;`,
      bind: {
        $battle_id: battleReportId,
        $units: JSON.stringify(resolvedOutcome.rescuedUnits),
      },
    });
  }

  if (resolvedOutcome.capturedAnimals.length > 0) {
    database.exec({
      sql: `INSERT INTO battle_report_captured_animals (battle_id, unit_id, amount)
        SELECT $battle_id, ui.id, SUM(json_extract(unit.value, '$.amount'))
        FROM json_each($units) AS unit JOIN unit_ids ui ON ui.unit = json_extract(unit.value, '$.unitId')
        GROUP BY ui.id;`,
      bind: {
        $battle_id: battleReportId,
        $units: JSON.stringify(resolvedOutcome.capturedAnimals),
      },
    });
  }

  if (resolvedOutcome.stolenItems.length > 0) {
    database.exec({
      sql: `INSERT INTO battle_report_stolen_items (battle_id, item_id, amount)
        SELECT $battle_id, json_extract(item.value, '$.itemId'), SUM(json_extract(item.value, '$.amount'))
        FROM json_each($items) AS item
        GROUP BY json_extract(item.value, '$.itemId');`,
      bind: {
        $battle_id: battleReportId,
        $items: JSON.stringify(resolvedOutcome.stolenItems),
      },
    });
  }

  return reportId;
};

export const insertTradeReport = (
  database: DbFacade,
  report: CreateNewTradeReport,
): number => {
  const reportId = insertReport(database, {
    villageId: report.villageId,
    timestamp: report.timestamp,
    type: 'trade',
    outcome: report.outcome,
    tags: [],
  });

  database.exec({
    sql: `
      INSERT INTO
        trade_reports (report_id, origin_tile_id, target_tile_id, wood, clay, iron, wheat)
      VALUES
        ($report_id, $origin_tile_id, $target_tile_id, $wood, $clay, $iron, $wheat);
    `,
    bind: {
      $report_id: reportId,
      $origin_tile_id: report.originTileId,
      $target_tile_id: report.targetTileId,
      $wood: report.resources.wood,
      $clay: report.resources.clay,
      $iron: report.resources.iron,
      $wheat: report.resources.wheat,
    },
  });

  return reportId;
};

export const insertScoutingReport = (
  database: DbFacade,
  report: CreateNewScoutingReport,
): number => {
  let insertedReportId = 0;

  database.transaction(() => {
    const reportId = insertReport(database, {
      villageId: report.villageId,
      timestamp: report.timestamp,
      type: 'scouting',
      outcome: report.outcome,
      tags: [],
    });

    const scoutingReportId = database.selectValue({
      sql: `
        INSERT INTO
          scouting_reports (report_id, origin_tile_id, target_tile_id, perspective, successful, scouting_target, wood,
                            clay, iron, wheat, item_id, item_amount)
        VALUES
          ($report_id, $origin_tile_id, $target_tile_id, $perspective, $successful, $target, $wood, $clay, $iron,
           $wheat, $item_id, $item_amount)
        RETURNING id;
      `,
      bind: {
        $report_id: reportId,
        $origin_tile_id: report.originTileId,
        $target_tile_id: report.targetTileId,
        $perspective: report.perspective,
        $successful: report.successful ? 1 : 0,
        $target: report.target,
        $wood: report.resources?.wood ?? null,
        $clay: report.resources?.clay ?? null,
        $iron: report.resources?.iron ?? null,
        $wheat: report.resources?.wheat ?? null,
        $item_id: report.itemId ?? null,
        $item_amount: report.itemAmount ?? null,
      },
      schema: z.int(),
    })!;

    database.exec({
      sql: `
        INSERT INTO
          scouting_report_attacker_units (scouting_report_id, unit_id, amount_before, amount_after)
        SELECT
          $scouting_report_id,
          unit_ids.id,
          JSON_EXTRACT(unit.value, '$.amountBefore'),
          JSON_EXTRACT(unit.value, '$.amountAfter')
        FROM
          JSON_EACH($units) AS unit
            JOIN unit_ids
                 ON unit_ids.unit = JSON_EXTRACT(unit.value, '$.unitId');
      `,
      bind: {
        $scouting_report_id: scoutingReportId,
        $units: JSON.stringify(report.attacker.units),
      },
    });

    const defenderUnits = report.defender.units.map((unit) => ({
      ...unit,
      role: 'defender',
      tileId: report.targetTileId,
    }));

    const reinforcementUnits = (report.defender.reinforcements ?? []).flatMap(
      (reinforcement) => {
        return reinforcement.units.map((unit) => ({
          ...unit,
          role: 'reinforcement',
          tileId: reinforcement.tileId,
        }));
      },
    );

    database.exec({
      sql: `
        INSERT INTO
          scouting_report_units (scouting_report_id, role, tile_id, unit_id, amount)
        SELECT
          $scouting_report_id,
          JSON_EXTRACT(unit.value, '$.role'),
          JSON_EXTRACT(unit.value, '$.tileId'),
          unit_ids.id,
          JSON_EXTRACT(unit.value, '$.amount')
        FROM
          jsonb_each($units) AS unit
            JOIN unit_ids
                 ON unit_ids.unit = JSON_EXTRACT(unit.value, '$.unitId');
      `,
      bind: {
        $scouting_report_id: scoutingReportId,
        $units: JSON.stringify([...defenderUnits, ...reinforcementUnits]),
      },
    });

    database.exec({
      sql: `
        INSERT INTO
          scouting_report_structures (scouting_report_id, building_id, level)
        SELECT
          $scouting_report_id,
          building_ids.id,
          JSON_EXTRACT(structure.value, '$.level')
        FROM
          JSON_EACH($structures) AS structure
            JOIN building_ids
                 ON building_ids.building = JSON_EXTRACT(
                   structure.value,
                   '$.buildingId'
                                            );
      `,
      bind: {
        $scouting_report_id: scoutingReportId,
        $structures: JSON.stringify(report.defensiveStructures ?? []),
      },
    });

    insertedReportId = reportId;
  });

  return insertedReportId;
};
