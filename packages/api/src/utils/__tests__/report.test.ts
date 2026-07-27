import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { insertReport } from '../report';

describe(insertReport, () => {
  test('keeps the newest 1,000 non-archived reports', async () => {
    const database = await prepareTestDatabase();

    database.exec({
      sql: `
        WITH RECURSIVE sequence(timestamp) AS (
          SELECT 1
          UNION ALL
          SELECT timestamp + 1 FROM sequence WHERE timestamp < 1000
        )
        INSERT INTO reports (
          village_id,
          timestamp,
          type_id,
          report_outcome_id
        )
        SELECT
          (SELECT id FROM villages ORDER BY id LIMIT 1),
          timestamp,
          (SELECT id FROM report_type_ids WHERE report_type = 'adventure'),
          (SELECT id FROM report_outcome_ids WHERE report_outcome = 'heroAdventure')
        FROM sequence;
      `,
    });
    database.exec({
      sql: `
        INSERT INTO report_tags (report_id, report_tag_id)
        SELECT r.id, rti.id
        FROM reports r
        CROSS JOIN report_tag_ids rti
        WHERE r.timestamp = 1
          AND rti.tag = 'archived';
      `,
    });

    const firstInsertedId = insertReport(database, {
      villageId: 1,
      timestamp: 1001,
      type: 'adventure',
      outcome: 'heroAdventure',
      tags: [],
    });
    const secondInsertedId = insertReport(database, {
      villageId: 1,
      timestamp: 1002,
      type: 'adventure',
      outcome: 'heroAdventure',
      tags: [],
    });

    const timestamps = database.selectValues({
      sql: 'SELECT timestamp FROM reports ORDER BY timestamp;',
      schema: z.int(),
    });

    expect(timestamps).toHaveLength(1001);
    expect(timestamps).toContain(1);
    expect(timestamps).not.toContain(2);
    expect(timestamps).toContain(1001);
    expect(timestamps).toContain(1002);
    expect(firstInsertedId).toBeGreaterThan(0);
    expect(secondInsertedId).toBeGreaterThan(firstInsertedId);
  });
});
