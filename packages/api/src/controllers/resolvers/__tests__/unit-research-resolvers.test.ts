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
      sql: 'SELECT * FROM unit_research WHERE village_id = $villageId AND unit_id = $unitId;',
      bind: { $villageId: villageId, $unitId: unitId },
      schema: z.object({ village_id: z.number(), unit_id: z.string() }),
    })!;

    expect(research).toBeDefined();
  });
});
