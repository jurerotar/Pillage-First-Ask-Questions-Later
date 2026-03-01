import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { heroRevivalResolver } from '../hero-resolvers';

describe('hero-resolvers', () => {
  test('heroRevivalResolver should set hero health to 100', async () => {
    const database = await prepareTestDatabase();

    database.exec({ sql: 'UPDATE heroes SET health = 0;' });

    database.exec({
      sql: "DELETE FROM effects WHERE source = 'hero' AND village_id = (SELECT village_id FROM heroes LIMIT 1);",
    });

    heroRevivalResolver(database, {
      id: 1,
      type: 'heroRevival',
      startsAt: Date.now(),
      duration: 1000,
      resolvesAt: Date.now() + 1000,
      villageId: 1,
    });

    const { health, villageId } = database.selectObject({
      sql: 'SELECT health, village_id AS villageId FROM heroes LIMIT 1;',
      schema: z.strictObject({ health: z.number(), villageId: z.number() }),
    })!;

    expect(health).toBe(100);

    const effects = database.selectObjects({
      sql: "SELECT ei.effect FROM effects e JOIN effect_ids ei ON e.effect_id = ei.id WHERE e.village_id = $village_id AND e.source = 'hero';",
      bind: { $village_id: villageId },
      schema: z.strictObject({ effect: z.string() }),
    });

    expect(effects).toHaveLength(4);
    const effectNames = effects.map((e) => e.effect);
    expect(effectNames).toContain('woodProduction');
    expect(effectNames).toContain('clayProduction');
    expect(effectNames).toContain('ironProduction');
    expect(effectNames).toContain('wheatProduction');
  });
});
