import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/api/testing';
import { createHeroRevivalEventMock } from '@pillage-first/mocks/event';
import { createEvents } from '../../../../utils/create-event';
import { heroRevivalResolver } from '../hero-revival-resolver';

describe('hero-resolvers', () => {
  test('heroRevivalResolver should set hero health to 100', async () => {
    using database = await prepareTestDatabase();

    database.exec({ sql: 'UPDATE heroes SET health = 0;' });

    database.exec({
      sql: "DELETE FROM effects WHERE source_id = (SELECT id FROM effect_source_ids WHERE source = 'hero') AND tile_id = (SELECT v.tile_id FROM heroes h JOIN villages v ON v.id = h.village_id LIMIT 1);",
    });

    heroRevivalResolver.resolve(
      database,
      createHeroRevivalEventMock({
        id: 1,
        startsAt: 1000,
        duration: 1000,
        villageId: 1,
      }),
      createEvents,
    );

    const { health, villageId } = database.selectObject({
      sql: 'SELECT health, village_id AS villageId FROM heroes LIMIT 1;',
      schema: z.strictObject({ health: z.number(), villageId: z.number() }),
    })!;

    expect(health).toBe(100);

    const effects = database.selectValues({
      sql: "SELECT ei.effect FROM effects e JOIN effect_ids ei ON e.effect_id = ei.id WHERE e.tile_id = (SELECT tile_id FROM villages WHERE id = $village_id) AND e.source_id = (SELECT id FROM effect_source_ids WHERE source = 'hero');",
      bind: { $village_id: villageId },
      schema: z.string(),
    });

    expect(effects).toHaveLength(4);

    const effectNames = effects.map((e) => e);

    expect(effectNames).toContain('woodProduction');
    expect(effectNames).toContain('clayProduction');
    expect(effectNames).toContain('ironProduction');
    expect(effectNames).toContain('wheatProduction');
  });
});
