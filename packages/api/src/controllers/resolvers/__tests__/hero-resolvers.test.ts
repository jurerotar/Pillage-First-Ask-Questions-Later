import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import {
  heroHealthRegenerationResolver,
  heroRevivalResolver,
} from '../hero-resolvers';

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

  test('heroHealthRegenerationResolver should increase health and schedule next event', async () => {
    const database = await prepareTestDatabase();

    // 1. Setup: hero at 50 health, with health_regeneration = 10
    database.exec({
      sql: 'UPDATE heroes SET health = 50, health_regeneration = 10;',
    });

    const eventArgs = {
      id: 1,
      type: 'heroHealthRegeneration' as const,
      startsAt: Date.now(),
      duration: 8640000, // 24h / 10
      resolvesAt: Date.now() + 8640000,
      villageId: 1,
    };

    // 2. Clear events to be sure
    database.exec({ sql: 'DELETE FROM events;' });

    // 3. Resolve
    heroHealthRegenerationResolver(database, eventArgs);

    // 4. Verify health increased
    const health = database.selectValue({
      sql: 'SELECT health FROM heroes LIMIT 1;',
      schema: z.number(),
    });
    expect(health).toBe(51);

    // 5. Verify next event scheduled
    const nextEvent = database.selectObject({
      sql: "SELECT type, starts_at AS startsAt FROM events WHERE type = 'heroHealthRegeneration' LIMIT 1;",
      schema: z.object({ type: z.string(), startsAt: z.number() }),
    });
    expect(nextEvent).toBeDefined();
    expect(nextEvent?.type).toBe('heroHealthRegeneration');
  });

  test('heroHealthRegenerationResolver should NOT increase health but SHOULD schedule next event if hero health is 100', async () => {
    const database = await prepareTestDatabase();

    // 1. Setup: hero at 100 health, with health_regeneration = 10
    database.exec({
      sql: 'UPDATE heroes SET health = 100, health_regeneration = 10;',
    });

    // 2. Clear events to be sure
    database.exec({ sql: 'DELETE FROM events;' });

    const eventArgs = {
      id: 1,
      type: 'heroHealthRegeneration' as const,
      startsAt: Date.now(),
      duration: 8640000,
      resolvesAt: Date.now() + 8640000,
      villageId: 1,
    };

    // 3. Resolve
    heroHealthRegenerationResolver(database, eventArgs);

    // 4. Verify health stays 100
    const health = database.selectValue({
      sql: 'SELECT health FROM heroes LIMIT 1;',
      schema: z.number(),
    });
    expect(health).toBe(100);

    // 5. Verify next event scheduled
    const nextEvent = database.selectObject({
      sql: "SELECT type FROM events WHERE type = 'heroHealthRegeneration' LIMIT 1;",
      schema: z.object({ type: z.string() }),
    });
    expect(nextEvent).toBeDefined();
    expect(nextEvent?.type).toBe('heroHealthRegeneration');
  });

  test('heroHealthRegenerationResolver should NOT increase health if hero is dead (original check)', async () => {
    const database = await prepareTestDatabase();

    database.exec({
      sql: 'UPDATE heroes SET health = 0, health_regeneration = 10;',
    });

    heroHealthRegenerationResolver(database, {
      id: 1,
      type: 'heroHealthRegeneration',
      startsAt: Date.now(),
      duration: 8640000,
      resolvesAt: Date.now() + 8640000,
      villageId: 1,
    });

    const health = database.selectValue({
      sql: 'SELECT health FROM heroes LIMIT 1;',
      schema: z.number(),
    });
    expect(health).toBe(0);
  });
});
