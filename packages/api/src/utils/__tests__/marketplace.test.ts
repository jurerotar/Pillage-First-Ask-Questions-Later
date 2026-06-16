import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { coordinatesToTileId } from '@pillage-first/utils/map';
import { getMerchantMovementDuration } from '../marketplace';

describe('marketplace utils', () => {
  test('getMerchantMovementDuration should scale directly with game world speed', async () => {
    const database = await prepareTestDatabase();
    const mapSize = database.selectValue({
      sql: 'SELECT map_size FROM servers LIMIT 1;',
      schema: z.number(),
    })!;
    const originTileId = coordinatesToTileId({ x: 0, y: 0 }, mapSize);
    const targetTileId = coordinatesToTileId({ x: 10, y: 0 }, mapSize);
    const merchantSpeed = 10;

    database.exec({
      sql: 'UPDATE servers SET speed = 1;',
    });

    const speedOneDuration = getMerchantMovementDuration(
      database,
      originTileId,
      targetTileId,
      merchantSpeed,
    );

    database.exec({
      sql: 'UPDATE servers SET speed = 2;',
    });

    const speedTwoDuration = getMerchantMovementDuration(
      database,
      originTileId,
      targetTileId,
      merchantSpeed,
    );

    expect(speedOneDuration).toBe(3_600_000);
    expect(speedTwoDuration).toBe(1_800_000);
  });
});
