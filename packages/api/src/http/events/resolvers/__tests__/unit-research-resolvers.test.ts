import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { createUnitResearchEventMock } from '@pillage-first/mocks/event';
import {
  reportOutcomeSchema,
  reportTypeSchema,
} from '@pillage-first/types/models/report';
import { type Unit, unitIdSchema } from '@pillage-first/types/models/unit';
import { selectVillageResearchedUnitsQuery } from '../../../../queries/unit-queries';
import { unitResearchResolver } from '../unit-research-resolvers';

describe(unitResearchResolver, () => {
  test('should insert unit research record', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const unitId: Unit['id'] = 'LEGIONNAIRE';

    const mockEvent = createUnitResearchEventMock({
      id: 1,
      startsAt: 1000,
      duration: 500,
      villageId,
      unitId,
    });

    unitResearchResolver(database, mockEvent);

    const research = database
      .selectObjects({
        sql: selectVillageResearchedUnitsQuery,
        bind: { $village_id: villageId },
        schema: z.strictObject({
          unit_id: unitIdSchema,
          village_id: z.number(),
        }),
      })
      .find((row) => row.unit_id === unitId);

    expect(research).toBeDefined();

    const report = database.selectObject({
      sql: `
        SELECT r.village_id, urr.village_id AS detail_village_id,
          r.timestamp, rti.report_type, roi.report_outcome, ui.unit AS unit_id
        FROM reports r
        JOIN report_type_ids rti ON rti.id = r.type_id
        JOIN report_outcome_ids roi ON roi.id = r.report_outcome_id
        JOIN unit_research_reports urr ON urr.report_id = r.id
        JOIN unit_ids ui ON ui.id = urr.unit_id
        WHERE rti.report_type = 'unitResearch'
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
      }),
    })!;

    expect(report).toStrictEqual({
      village_id: villageId,
      detail_village_id: villageId,
      timestamp: mockEvent.resolvesAt,
      report_type: 'unitResearch',
      report_outcome: 'unitResearched',
      unit_id: unitId,
    });
  });
});
