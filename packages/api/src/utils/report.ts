import { z } from 'zod';
import type { Building } from '@pillage-first/types/models/building';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import type {
  BaseReport,
  ReportOutcome,
} from '@pillage-first/types/models/report';
import type { Resources } from '@pillage-first/types/models/resource';
import type { Tribe } from '@pillage-first/types/models/tribe';
import type { UnitId } from '@pillage-first/types/models/unit';
import type { DbFacade } from '@pillage-first/utils/facades/database';

export type CreateNewReport = Pick<
  BaseReport,
  'villageId' | 'timestamp' | 'type' | 'outcome' | 'tags'
>;

export type CreateNewTradeReport = Pick<
  CreateNewReport,
  'villageId' | 'timestamp'
> & {
  outcome: Extract<
    ReportOutcome,
    'incomingMerchantsArrived' | 'outgoingMerchantsArrived'
  >;
  originTileId: number;
  targetTileId: number;
  resources: Resources;
};

export type CreateNewScoutingReport = Pick<
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
  defensiveStructures?: { buildingId: Building['id']; level: number }[];
};

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
      schema: z.int(),
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
                            clay, iron, wheat)
        VALUES
          ($report_id, $origin_tile_id, $target_tile_id, $perspective, $successful, $target, $wood, $clay, $iron,
           $wheat)
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
          JSON_EACH($units) AS unit
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
