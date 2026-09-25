import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { createUnitImprovementEventMock } from '@pillage-first/mocks/event';
import {
  reportOutcomeSchema,
  reportTypeSchema,
} from '@pillage-first/types/models/report';
import { type Unit, unitIdSchema } from '@pillage-first/types/models/unit';
import { unitImprovementResolver } from '../unit-improvement-resolvers';

describe(unitImprovementResolver, () => {
  test('should increase unit improvement level', async () => {
    const database = await prepareTestDatabase();
    const unitId: Unit['id'] = 'LEGIONNAIRE';
    const villageId = 1;

    // Get player_id from village
    const playerId = database.selectValue({
      sql: 'SELECT player_id AS playerId FROM villages WHERE id = $village_id;',
      bind: { $village_id: villageId },
      schema: z.number(),
    })!;

    // Ensure a row exists for unitId
    database.exec({
      sql: 'INSERT INTO unit_improvements (unit_id, level, player_id) VALUES ((SELECT id FROM unit_ids WHERE unit = $unit_id), 0, $player_id) ON CONFLICT DO NOTHING;',
      bind: { $unit_id: unitId, $player_id: playerId },
    });

    const mockEvent = createUnitImprovementEventMock({
      id: 2,
      startsAt: 1000,
      duration: 500,
      villageId,
      unitId,
      level: 1,
    });

    unitImprovementResolver(database, { ...mockEvent, id: 999 });

    const improvement = database.selectValue({
      sql: 'SELECT level FROM unit_improvements WHERE unit_id = (SELECT id FROM unit_ids WHERE unit = $unit_id);',
      bind: { $unit_id: unitId },
      schema: z.number(),
    })!;

    expect(improvement).toBeGreaterThanOrEqual(1);

    const report = database.selectObject({
      sql: `
        SELECT r.village_id, uir.village_id AS detail_village_id,
          r.timestamp, rti.report_type, roi.report_outcome, ui.unit AS unit_id,
          uir.level
        FROM reports r
        JOIN report_type_ids rti ON rti.id = r.type_id
        JOIN report_outcome_ids roi ON roi.id = r.report_outcome_id
        JOIN unit_improvement_reports uir ON uir.report_id = r.id
        JOIN unit_ids ui ON ui.id = uir.unit_id
        WHERE rti.report_type = 'unitImprovement'
        ORDER BY r.id DESC
        LIMIT 1;
      `,
      schema: z.strictObject({
        village_id: z.number(),
        detail_village_id: z.number(),
        timestamp: z.number(),
        report_type: reportTypeSchema,
        report_outcome: reportOutcomeSchema,
        unit_id: unitIdSchema,
        level: z.number(),
      }),
    })!;

    expect(report).toStrictEqual({
      village_id: villageId,
      detail_village_id: villageId,
      timestamp: mockEvent.resolvesAt,
      report_type: 'unitImprovement',
      report_outcome: 'unitImproved',
      unit_id: unitId,
      level: mockEvent.level,
    });
  });
});
