import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { items } from '@pillage-first/game-assets/items';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { prepareTestDatabase } from '../../';
import { stackableHeroItemAmountRanges } from '../world-items-seeder';

const database = await prepareTestDatabase();

describe('worldItemsSeeder', () => {
  test('world_items seeded only for NPC villages', () => {
    const invalid = database.selectValue({
      sql: `
        SELECT COUNT(*)
        FROM
          world_items wi
            JOIN villages v ON wi.tile_id = v.tile_id
        WHERE
          v.player_id = $player_id;
      `,
      bind: { $player_id: PLAYER_ID },
      schema: z.number(),
    });
    expect(invalid).toBe(0);

    const count = database.selectValue({
      sql: 'SELECT COUNT(*) FROM world_items;',
      schema: z.number(),
    });
    expect(count).toBeGreaterThan(0);

    const resourceItemCount = database.selectValue({
      sql: 'SELECT COUNT(*) FROM world_items WHERE item_id IN (1026, 1027, 1028, 1029);',
      schema: z.number(),
    });
    expect(resourceItemCount).toBe(0);
  });

  test('world_items use amount ranges only for stackable items', () => {
    const worldItems = database.selectObjects({
      sql: 'SELECT item_id, amount FROM world_items;',
      schema: z.strictObject({
        item_id: z.number(),
        amount: z.number(),
      }),
    });

    const itemsById = new Map(items.map((item) => [item.id, item]));

    for (const { item_id, amount } of worldItems) {
      const item = itemsById.get(item_id)!;
      const amountRange = stackableHeroItemAmountRanges.get(item.name);

      if (!amountRange) {
        expect(amount).toBe(1);
        continue;
      }

      const [min, max] = amountRange;
      expect(amount).toBeGreaterThanOrEqual(min);
      expect(amount).toBeLessThanOrEqual(max);
    }
  });

  test('stackable amount ranges target only consumables and silver', () => {
    const itemsByName = new Map(items.map((item) => [item.name, item]));

    for (const itemName of stackableHeroItemAmountRanges.keys()) {
      const item = itemsByName.get(itemName)!;

      expect(['consumable', 'currency']).toContain(item.category);
      expect(
        item.category === 'consumable' || item.name === 'SILVER',
      ).toBeTruthy();
    }
  });
});
