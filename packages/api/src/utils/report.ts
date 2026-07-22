import { z } from 'zod';
import type {
  BaseReport,
  ReportOutcome,
} from '@pillage-first/types/models/report';
import type { Resources } from '@pillage-first/types/models/resource';
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
