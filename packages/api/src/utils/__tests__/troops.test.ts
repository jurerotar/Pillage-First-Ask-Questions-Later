import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/api/testing';
import type { Troop } from '@pillage-first/types/models/troop';
import type { Unit } from '@pillage-first/types/models/unit';
import { addTroops, removeTroops } from '../troops';

describe('troop-queries', () => {
  describe(addTroops, () => {
    test('should insert new troops', async () => {
      using database = await prepareTestDatabase();

      const tileId = 1;
      const sourceTileId = 1;
      const troops: Troop[] = [
        {
          unitId: 'LEGIONNAIRE',
          amount: 10,
          tileId,
          sourceTileId,
        },
      ];

      addTroops(database, troops);

      const result = database.selectValue({
        sql: 'SELECT amount FROM troops WHERE tile_id = $tile_id AND source_tile_id = $source_tile_id AND unit_id = (SELECT id FROM unit_ids WHERE unit = $unit_id)',
        bind: {
          $tile_id: tileId,
          $source_tile_id: sourceTileId,
          $unit_id: 'LEGIONNAIRE',
        },
        schema: z.number(),
      });

      expect(result).toBe(10);
    });

    test('should update existing troops on conflict', async () => {
      using database = await prepareTestDatabase();

      const tileId = 1;
      const sourceTileId = 1;
      const unitId: Unit['id'] = 'LEGIONNAIRE';

      // First add
      addTroops(database, [{ unitId, amount: 10, tileId, sourceTileId }]);

      // Second add
      addTroops(database, [{ unitId, amount: 5, tileId, sourceTileId }]);

      const result = database.selectValue({
        sql: 'SELECT amount FROM troops WHERE tile_id = $tile_id AND source_tile_id = $source_tile_id AND unit_id = (SELECT id FROM unit_ids WHERE unit = $unit_id)',
        bind: {
          $tile_id: tileId,
          $source_tile_id: sourceTileId,
          $unit_id: unitId,
        },
        schema: z.number(),
      });

      expect(result).toBe(15);
    });

    test('should handle multiple unit types in a single call', async () => {
      using database = await prepareTestDatabase();

      const tileId = 1;
      const sourceTileId = 1;

      const troopsToAdd: Troop[] = [
        {
          unitId: 'LEGIONNAIRE',
          amount: 10,
          tileId,
          sourceTileId,
        },
        {
          unitId: 'PRAETORIAN',
          amount: 20,
          tileId,
          sourceTileId,
        },
        {
          unitId: 'IMPERIAN',
          amount: 30,
          tileId,
          sourceTileId,
        },
      ];

      addTroops(database, troopsToAdd);

      const checkTroops = (unitId: Unit['id'], expectedAmount: number) => {
        const result = database.selectValue({
          sql: 'SELECT amount FROM troops WHERE tile_id = $tile_id AND source_tile_id = $source_tile_id AND unit_id = (SELECT id FROM unit_ids WHERE unit = $unit_id)',
          bind: {
            $tile_id: tileId,
            $source_tile_id: sourceTileId,
            $unit_id: unitId,
          },
          schema: z.number(),
        });

        expect(result).toBe(expectedAmount);
      };

      checkTroops('LEGIONNAIRE', 10);
      checkTroops('PRAETORIAN', 20);
      checkTroops('IMPERIAN', 30);
    });

    test('should handle troops from different sources and targets', async () => {
      using database = await prepareTestDatabase();

      const troopsToAdd: Troop[] = [
        { unitId: 'LEGIONNAIRE', amount: 10, tileId: 1, sourceTileId: 1 },
        { unitId: 'LEGIONNAIRE', amount: 20, tileId: 2, sourceTileId: 1 },
        { unitId: 'LEGIONNAIRE', amount: 30, tileId: 1, sourceTileId: 2 },
      ];

      addTroops(database, troopsToAdd);

      const checkTroops = (
        unitId: Unit['id'],
        tileId: number,
        sourceTileId: number,
        expectedAmount: number,
      ) => {
        const result = database.selectValue({
          sql: 'SELECT amount FROM troops WHERE tile_id = $tile_id AND source_tile_id = $source_tile_id AND unit_id = (SELECT id FROM unit_ids WHERE unit = $unit_id)',
          bind: {
            $tile_id: tileId,
            $source_tile_id: sourceTileId,
            $unit_id: unitId,
          },
          schema: z.number(),
        });

        expect(result).toBe(expectedAmount);
      };

      checkTroops('LEGIONNAIRE', 1, 1, 10);
      checkTroops('LEGIONNAIRE', 2, 1, 20);
      checkTroops('LEGIONNAIRE', 1, 2, 30);
    });
  });

  describe(removeTroops, () => {
    test('should subtract troops', async () => {
      using database = await prepareTestDatabase();

      const tileId = 1;
      const sourceTileId = 1;
      const unitId: Unit['id'] = 'LEGIONNAIRE';

      // Setup
      addTroops(database, [{ unitId, amount: 10, tileId, sourceTileId }]);

      // Remove
      removeTroops(database, [{ unitId, amount: 4, tileId, sourceTileId }]);

      const result = database.selectValue({
        sql: 'SELECT amount FROM troops WHERE tile_id = $tile_id AND source_tile_id = $source_tile_id AND unit_id = (SELECT id FROM unit_ids WHERE unit = $unit_id)',
        bind: {
          $tile_id: tileId,
          $source_tile_id: sourceTileId,
          $unit_id: unitId,
        },
        schema: z.number(),
      });

      expect(result).toBe(6);
    });

    test('should delete troops if amount reaches 0', async () => {
      using database = await prepareTestDatabase();

      const tileId = 1;
      const sourceTileId = 1;
      const unitId: Unit['id'] = 'LEGIONNAIRE';

      // Setup
      addTroops(database, [{ unitId, amount: 10, tileId, sourceTileId }]);

      // Remove exact amount
      removeTroops(database, [{ unitId, amount: 10, tileId, sourceTileId }]);

      const result = database.selectValue({
        sql: 'SELECT amount FROM troops WHERE tile_id = $tile_id AND source_tile_id = $source_tile_id AND unit_id = (SELECT id FROM unit_ids WHERE unit = $unit_id)',
        bind: {
          $tile_id: tileId,
          $source_tile_id: sourceTileId,
          $unit_id: unitId,
        },
        schema: z.number(),
      });

      expect(result).toBeUndefined();
    });

    test('should delete troops if amount reaches negative (though should not happen)', async () => {
      using database = await prepareTestDatabase();

      const tileId = 1;
      const sourceTileId = 1;
      const unitId: Unit['id'] = 'LEGIONNAIRE';

      // Setup
      addTroops(database, [{ unitId, amount: 10, tileId, sourceTileId }]);

      // Remove more than available
      removeTroops(database, [{ unitId, amount: 15, tileId, sourceTileId }]);

      const result = database.selectValue({
        sql: 'SELECT amount FROM troops WHERE tile_id = $tile_id AND source_tile_id = $source_tile_id AND unit_id = (SELECT id FROM unit_ids WHERE unit = $unit_id)',
        bind: {
          $tile_id: tileId,
          $source_tile_id: sourceTileId,
          $unit_id: unitId,
        },
        schema: z.number(),
      });

      expect(result).toBeUndefined();
    });

    test('should handle multiple unit types in a single remove call', async () => {
      using database = await prepareTestDatabase();

      const tileId = 1;
      const sourceTileId = 1;

      // Setup
      addTroops(database, [
        {
          unitId: 'LEGIONNAIRE',
          amount: 10,
          tileId,
          sourceTileId,
        },
        {
          unitId: 'PRAETORIAN',
          amount: 20,
          tileId,
          sourceTileId,
        },
      ]);

      const check = (unitId: Unit['id']) => {
        return database.selectValue({
          sql: 'SELECT amount FROM troops WHERE tile_id = $tile_id AND source_tile_id = $source_tile_id AND unit_id = (SELECT id FROM unit_ids WHERE unit = $unit_id)',
          bind: {
            $tile_id: tileId,
            $source_tile_id: sourceTileId,
            $unit_id: unitId,
          },
          schema: z.number(),
        });
      };

      expect(check('LEGIONNAIRE')).toBe(10);
      expect(check('PRAETORIAN')).toBe(20);

      // Remove some of each
      removeTroops(database, [
        {
          unitId: 'LEGIONNAIRE',
          amount: 5,
          tileId,
          sourceTileId,
        },
        {
          unitId: 'PRAETORIAN',
          amount: 20,
          tileId,
          sourceTileId,
        },
      ]);

      expect(check('LEGIONNAIRE')).toBe(5);
      expect(check('PRAETORIAN')).toBeUndefined();
    });

    test('should be a no-op if removing troops that do not exist', async () => {
      using database = await prepareTestDatabase();

      const tileId = 1;
      const sourceTileId = 1;

      // Attempt to remove non-existent troops
      removeTroops(database, [
        {
          unitId: 'LEGIONNAIRE',
          amount: 10,
          tileId,
          sourceTileId,
        },
      ]);

      const result = database.selectValue({
        sql: 'SELECT amount FROM troops WHERE tile_id = $tile_id AND source_tile_id = $source_tile_id AND unit_id = (SELECT id FROM unit_ids WHERE unit = $unit_id)',
        bind: {
          $tile_id: tileId,
          $source_tile_id: sourceTileId,
          $unit_id: 'LEGIONNAIRE',
        },
        schema: z.number(),
      });

      expect(result).toBeUndefined();
    });
  });
});
