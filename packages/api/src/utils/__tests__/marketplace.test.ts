import { describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { merchantsMap } from '@pillage-first/game-assets/merchants';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { tribeSchema } from '@pillage-first/types/models/tribe';
import { coordinatesToTileId } from '@pillage-first/utils/map';
import {
  getMerchantMovementDurationByVillageId,
  getVillageMerchantStats,
  getVillageMerchantStatsByTileId,
} from '../marketplace';

describe('marketplace utils', () => {
  test('merchant movement duration should scale directly with game world speed', async () => {
    const database = await prepareTestDatabase();
    const village = database.selectObject({
      sql: `
        SELECT
          v.id,
          ti.tribe,
          s.map_size AS mapSize
        FROM
          villages v
            JOIN players p ON p.id = v.player_id
            JOIN tribe_ids ti ON ti.id = p.tribe_id
            CROSS JOIN servers s
        WHERE
          v.player_id = $player_id
        LIMIT 1;
      `,
      bind: { $player_id: PLAYER_ID },
      schema: z.strictObject({
        id: z.number(),
        tribe: tribeSchema,
        mapSize: z.number(),
      }),
    })!;
    const originTileId = coordinatesToTileId({ x: 0, y: 0 }, village.mapSize);
    const targetTileId = coordinatesToTileId({ x: 10, y: 0 }, village.mapSize);
    const merchantSpeed = merchantsMap.get(village.tribe)!.merchantSpeed;
    const selectObject = vi.spyOn(database, 'selectObject');

    database.exec({
      sql: 'UPDATE servers SET speed = 1;',
    });

    const speedOneDuration = getMerchantMovementDurationByVillageId(
      database,
      village.id,
      originTileId,
      targetTileId,
    );

    expect(selectObject).toHaveBeenCalledTimes(1);

    selectObject.mockClear();

    database.exec({
      sql: 'UPDATE servers SET speed = 2;',
    });

    const speedTwoDuration = getMerchantMovementDurationByVillageId(
      database,
      village.id,
      originTileId,
      targetTileId,
    );

    expect(selectObject).toHaveBeenCalledTimes(1);
    expect(speedOneDuration).toBe(10 * (3_600_000 / merchantSpeed));
    expect(speedTwoDuration).toBe(5 * (3_600_000 / merchantSpeed));
  });

  test('loads merchant stats in one database call', async () => {
    const database = await prepareTestDatabase();
    const village = database.selectObject({
      sql: 'SELECT id, tile_id AS tileId FROM villages LIMIT 1;',
      schema: z.strictObject({
        id: z.number(),
        tileId: z.number(),
      }),
    })!;
    const selectObject = vi.spyOn(database, 'selectObject');

    const statsById = getVillageMerchantStats(database, village.id);

    expect(selectObject).toHaveBeenCalledTimes(1);

    selectObject.mockClear();

    const statsByTileId = getVillageMerchantStatsByTileId(
      database,
      village.tileId,
    );

    expect(selectObject).toHaveBeenCalledTimes(1);
    expect(statsByTileId).toEqual(statsById);
  });
});
