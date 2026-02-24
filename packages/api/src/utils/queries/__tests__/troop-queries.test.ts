import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import type { Troop } from '@pillage-first/types/models/troop';
import type { Unit } from '@pillage-first/types/models/unit';
import { addTroops, removeTroops } from '../troop-queries';

describe('troop-queries', () => {
  describe('addTroops', () => {
    test('should insert new troops', async () => {
      const database = await prepareTestDatabase();

      const tileId = 1;
      const sourceTileId = 1;
      const troops: Troop[] = [
        {
          unitId: 'LEGIONNAIRE',
          amount: 10,
          tileId,
          source: sourceTileId,
        },
      ];

      addTroops(database, troops);

      const result = database.selectObject({
        sql: 'SELECT amount FROM troops WHERE tile_id = $tileId AND source_tile_id = $sourceTileId AND unit_id = (SELECT id FROM unit_ids WHERE unit = $unitId)',
        bind: {
          $tileId: tileId,
          $sourceTileId: sourceTileId,
          $unitId: 'LEGIONNAIRE',
        },
        schema: z.strictObject({ amount: z.number() }),
      });

      expect(result?.amount).toBe(10);
    });

    test('should update existing troops on conflict', async () => {
      const database = await prepareTestDatabase();

      const tileId = 1;
      const sourceTileId = 1;
      const unitId: Unit['id'] = 'LEGIONNAIRE';

      // First add
      addTroops(database, [
        { unitId, amount: 10, tileId, source: sourceTileId },
      ]);

      // Second add
      addTroops(database, [
        { unitId, amount: 5, tileId, source: sourceTileId },
      ]);

      const result = database.selectObject({
        sql: 'SELECT amount FROM troops WHERE tile_id = $tileId AND source_tile_id = $sourceTileId AND unit_id = (SELECT id FROM unit_ids WHERE unit = $unitId)',
        bind: { $tileId: tileId, $sourceTileId: sourceTileId, $unitId: unitId },
        schema: z.strictObject({ amount: z.number() }),
      });

      expect(result?.amount).toBe(15);
    });

    test('should handle multiple unit types in a single call', async () => {
      const database = await prepareTestDatabase();

      const tileId = 1;
      const sourceTileId = 1;

      const troopsToAdd: Troop[] = [
        {
          unitId: 'LEGIONNAIRE',
          amount: 10,
          tileId,
          source: sourceTileId,
        },
        {
          unitId: 'PRAETORIAN',
          amount: 20,
          tileId,
          source: sourceTileId,
        },
        {
          unitId: 'IMPERIAN',
          amount: 30,
          tileId,
          source: sourceTileId,
        },
      ];

      addTroops(database, troopsToAdd);

      const checkTroops = (unitId: Unit['id'], expectedAmount: number) => {
        const result = database.selectObject({
          sql: 'SELECT amount FROM troops WHERE tile_id = $tileId AND source_tile_id = $sourceTileId AND unit_id = (SELECT id FROM unit_ids WHERE unit = $unitId)',
          bind: {
            $tileId: tileId,
            $sourceTileId: sourceTileId,
            $unitId: unitId,
          },
          schema: z.strictObject({ amount: z.number() }),
        });
        expect(result?.amount).toBe(expectedAmount);
      };

      checkTroops('LEGIONNAIRE', 10);
      checkTroops('PRAETORIAN', 20);
      checkTroops('IMPERIAN', 30);
    });

    test('should handle troops from different sources and targets', async () => {
      const database = await prepareTestDatabase();

      const troopsToAdd: Troop[] = [
        { unitId: 'LEGIONNAIRE', amount: 10, tileId: 1, source: 1 },
        { unitId: 'LEGIONNAIRE', amount: 20, tileId: 2, source: 1 },
        { unitId: 'LEGIONNAIRE', amount: 30, tileId: 1, source: 2 },
      ];

      addTroops(database, troopsToAdd);

      const checkTroops = (
        unitId: Unit['id'],
        tileId: number,
        source: number,
        expectedAmount: number,
      ) => {
        const result = database.selectObject({
          sql: 'SELECT amount FROM troops WHERE tile_id = $tileId AND source_tile_id = $sourceTileId AND unit_id = (SELECT id FROM unit_ids WHERE unit = $unitId)',
          bind: { $tileId: tileId, $sourceTileId: source, $unitId: unitId },
          schema: z.strictObject({ amount: z.number() }),
        });
        expect(result?.amount).toBe(expectedAmount);
      };

      checkTroops('LEGIONNAIRE', 1, 1, 10);
      checkTroops('LEGIONNAIRE', 2, 1, 20);
      checkTroops('LEGIONNAIRE', 1, 2, 30);
    });
  });

  describe('removeTroops', () => {
    test('should subtract troops', async () => {
      const database = await prepareTestDatabase();

      const tileId = 1;
      const sourceTileId = 1;
      const unitId: Unit['id'] = 'LEGIONNAIRE';

      // Setup
      addTroops(database, [
        { unitId, amount: 10, tileId, source: sourceTileId },
      ]);

      // Remove
      removeTroops(database, [
        { unitId, amount: 4, tileId, source: sourceTileId },
      ]);

      const result = database.selectObject({
        sql: 'SELECT amount FROM troops WHERE tile_id = $tileId AND source_tile_id = $sourceTileId AND unit_id = (SELECT id FROM unit_ids WHERE unit = $unitId)',
        bind: { $tileId: tileId, $sourceTileId: sourceTileId, $unitId: unitId },
        schema: z.strictObject({ amount: z.number() }),
      });

      expect(result?.amount).toBe(6);
    });

    test('should delete troops if amount reaches 0', async () => {
      const database = await prepareTestDatabase();

      const tileId = 1;
      const sourceTileId = 1;
      const unitId: Unit['id'] = 'LEGIONNAIRE';

      // Setup
      addTroops(database, [
        { unitId, amount: 10, tileId, source: sourceTileId },
      ]);

      // Remove exact amount
      removeTroops(database, [
        { unitId, amount: 10, tileId, source: sourceTileId },
      ]);

      const result = database.selectObject({
        sql: 'SELECT amount FROM troops WHERE tile_id = $tileId AND source_tile_id = $sourceTileId AND unit_id = (SELECT id FROM unit_ids WHERE unit = $unitId)',
        bind: { $tileId: tileId, $sourceTileId: sourceTileId, $unitId: unitId },
        schema: z.strictObject({ amount: z.number() }),
      });

      expect(result).toBeUndefined();
    });

    test('should delete troops if amount reaches negative (though should not happen)', async () => {
      const database = await prepareTestDatabase();

      const tileId = 1;
      const sourceTileId = 1;
      const unitId: Unit['id'] = 'LEGIONNAIRE';

      // Setup
      addTroops(database, [
        { unitId, amount: 10, tileId, source: sourceTileId },
      ]);

      // Remove more than available
      removeTroops(database, [
        { unitId, amount: 15, tileId, source: sourceTileId },
      ]);

      const result = database.selectObject({
        sql: 'SELECT amount FROM troops WHERE tile_id = $tileId AND source_tile_id = $sourceTileId AND unit_id = (SELECT id FROM unit_ids WHERE unit = $unitId)',
        bind: { $tileId: tileId, $sourceTileId: sourceTileId, $unitId: unitId },
        schema: z.strictObject({ amount: z.number() }),
      });

      expect(result).toBeUndefined();
    });

    test('should handle multiple unit types in a single remove call', async () => {
      const database = await prepareTestDatabase();

      const tileId = 1;
      const sourceTileId = 1;

      // Setup
      addTroops(database, [
        {
          unitId: 'LEGIONNAIRE',
          amount: 10,
          tileId,
          source: sourceTileId,
        },
        {
          unitId: 'PRAETORIAN',
          amount: 20,
          tileId,
          source: sourceTileId,
        },
      ]);

      const check = (unitId: Unit['id']) => {
        return database.selectObject({
          sql: 'SELECT amount FROM troops WHERE tile_id = $tileId AND source_tile_id = $sourceTileId AND unit_id = (SELECT id FROM unit_ids WHERE unit = $unitId)',
          bind: {
            $tileId: tileId,
            $sourceTileId: sourceTileId,
            $unitId: unitId,
          },
          schema: z.strictObject({ amount: z.number() }),
        });
      };

      expect(check('LEGIONNAIRE')?.amount).toBe(10);
      expect(check('PRAETORIAN')?.amount).toBe(20);

      // Remove some of each
      removeTroops(database, [
        {
          unitId: 'LEGIONNAIRE',
          amount: 5,
          tileId,
          source: sourceTileId,
        },
        {
          unitId: 'PRAETORIAN',
          amount: 20,
          tileId,
          source: sourceTileId,
        },
      ]);

      expect(check('LEGIONNAIRE')?.amount).toBe(5);
      expect(check('PRAETORIAN')).toBeUndefined();
    });

    test('should be a no-op if removing troops that do not exist', async () => {
      const database = await prepareTestDatabase();

      const tileId = 1;
      const sourceTileId = 1;

      // Attempt to remove non-existent troops
      removeTroops(database, [
        {
          unitId: 'LEGIONNAIRE',
          amount: 10,
          tileId,
          source: sourceTileId,
        },
      ]);

      const result = database.selectObject({
        sql: 'SELECT amount FROM troops WHERE tile_id = $tileId AND source_tile_id = $sourceTileId AND unit_id = (SELECT id FROM unit_ids WHERE unit = $unitId)',
        bind: {
          $tileId: tileId,
          $sourceTileId: sourceTileId,
          $unitId: 'LEGIONNAIRE',
        },
        schema: z.strictObject({ amount: z.number() }),
      });

      expect(result).toBeUndefined();
    });
  });
});
