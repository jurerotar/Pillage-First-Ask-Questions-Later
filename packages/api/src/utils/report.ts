import { z } from 'zod';
import type { Building } from '@pillage-first/types/models/building';
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
        reports (
          village_id,
          timestamp,
          type_id,
          report_outcome_id
        )
      VALUES
        (
          $village_id,
          $timestamp,
          (
            SELECT
              id
            FROM
              report_type_ids
            WHERE
              report_type = $type
          ),
          (
            SELECT
              id
            FROM
              report_outcome_ids
            WHERE
              report_outcome = $outcome
          )
        )
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
        INSERT INTO report_tags (report_id, report_tag_id)
        SELECT $report_id, report_tag_ids.id
        FROM json_each($tags)
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
      INSERT INTO trade_reports (
        report_id,
        origin_tile_id,
        target_tile_id,
        wood,
        clay,
        iron,
        wheat
      ) VALUES (
        $report_id,
        $origin_tile_id,
        $target_tile_id,
        $wood,
        $clay,
        $iron,
        $wheat
      );
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
      sql: `INSERT INTO scouting_reports (report_id, origin_tile_id, target_tile_id, perspective, successful, scouting_target, wood, clay, iron, wheat)
        VALUES ($report_id, $origin_tile_id, $target_tile_id, $perspective, $successful, $target, $wood, $clay, $iron, $wheat) RETURNING id;`,
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

    for (const unit of report.attacker.units) {
      database.exec({
        sql: `INSERT INTO scouting_report_attacker_units (scouting_report_id, unit_id, amount_before, amount_after)
          SELECT $id, id, $amount_before, $amount_after FROM unit_ids WHERE unit = $unit_id;`,
        bind: {
          $id: scoutingReportId,
          $unit_id: unit.unitId,
          $amount_before: unit.amountBefore,
          $amount_after: unit.amountAfter,
        },
      });
    }

    for (const [role, tileId, troops] of [
      ['defender', report.targetTileId, report.defender],
      ...(report.defender.reinforcements ?? []).map(
        (reinforcement) =>
          ['reinforcement', reinforcement.tileId, reinforcement] as const,
      ),
    ] as const) {
      for (const unit of troops.units) {
        database.exec({
          sql: `INSERT INTO scouting_report_units (scouting_report_id, role, tile_id, unit_id, amount)
          SELECT $id, $role, $tile_id, id, $amount FROM unit_ids WHERE unit = $unit_id;`,
          bind: {
            $id: scoutingReportId,
            $role: role,
            $tile_id: tileId,
            $unit_id: unit.unitId,
            $amount: unit.amount,
          },
        });
      }
    }

    for (const structure of report.defensiveStructures ?? []) {
      database.exec({
        sql: `INSERT INTO scouting_report_structures (scouting_report_id, building_id, level)
        SELECT $id, id, $level FROM building_ids WHERE building = $building_id;`,
        bind: {
          $id: scoutingReportId,
          $building_id: structure.buildingId,
          $level: structure.level,
        },
      });
    }
    insertedReportId = reportId;
  });

  return insertedReportId;
};
