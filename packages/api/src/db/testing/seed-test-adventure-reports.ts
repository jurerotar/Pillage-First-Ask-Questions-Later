import { z } from 'zod';
import type { DbFacade } from '@pillage-first/utils/facades/database';

export const seedTestAdventureReports = (
  database: DbFacade,
  villageId: number,
  count: number,
  timestamp: number,
  timestampStep = 1,
): void => {
  const ids = database.selectValues({
    sql: `WITH RECURSIVE sequence(n) AS (
      SELECT 1 WHERE $count > 0
      UNION ALL SELECT n + 1 FROM sequence WHERE n < $count
    )
    INSERT INTO reports (village_id, timestamp, type_id, report_outcome_id)
    SELECT $village_id, $timestamp + (n - 1) * $timestamp_step,
      (SELECT id FROM report_type_ids WHERE report_type = 'adventure'),
      (SELECT id FROM report_outcome_ids WHERE report_outcome = 'heroAdventure')
    FROM sequence RETURNING id;`,
    bind: {
      $village_id: villageId,
      $count: count,
      $timestamp: timestamp,
      $timestamp_step: timestampStep,
    },
    schema: z.int(),
  });

  database.exec({
    sql: `INSERT INTO hero_adventure_reports (report_id, adventure_id, item_id, item_amount, health_before, health_after)
      SELECT value, 1, NULL, NULL, 100, 95 FROM json_each($ids);`,
    bind: { $ids: JSON.stringify(ids) },
  });
};
