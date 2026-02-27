import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { Unit } from '@pillage-first/types/models/unit';
import { unitResearchResolver } from '../unit-research-resolvers';

describe(unitResearchResolver, () => {
  test('should insert unit research record', async () => {
    const database = await prepareTestDatabase();
    const villageId = 1;
    const unitId: Unit['id'] = 'LEGIONNAIRE';

    const mockEvent: GameEvent<'unitResearch'> = {
      id: 1,
      type: 'unitResearch',
      startsAt: 1000,
      duration: 500,
      resolvesAt: 1500,
      villageId,
      unitId,
    };

    unitResearchResolver(database, mockEvent);

    const research = database.selectObject({
      sql: 'SELECT village_id, unit_id FROM unit_research WHERE village_id = $village_id AND unit_id = (SELECT id FROM unit_ids WHERE unit = $unit_id);',
      bind: { $village_id: villageId, $unit_id: unitId },
      schema: z.strictObject({ village_id: z.number(), unit_id: z.number() }),
    })!;

    expect(research).toBeDefined();
  });
});
