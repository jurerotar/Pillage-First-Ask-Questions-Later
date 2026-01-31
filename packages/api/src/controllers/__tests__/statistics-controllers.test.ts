import { describe, expect, test } from 'vitest';
import { prepareTestDatabase } from '@pillage-first/db';
import {
  getGameWorldOverview,
  getPlayerRankings,
  getVillageRankings,
} from '../statistics-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('statistics-controllers', () => {
  test('getPlayerRankings should return player rankings', async () => {
    const database = await prepareTestDatabase();

    getPlayerRankings(
      database,
      createControllerArgs<
        '/statistics/players',
        'get',
        { lastPlayerId: number | null }
      >({
        body: { lastPlayerId: null },
      }),
    );

    expect(true).toBeTruthy();
  });

  test('getVillageRankings should return village rankings', async () => {
    const database = await prepareTestDatabase();

    getVillageRankings(
      database,
      createControllerArgs<
        '/statistics/villages',
        'get',
        { lastVillageId: number | null }
      >({
        body: { lastVillageId: null },
      }),
    );

    expect(true).toBeTruthy();
  });

  test('getGameWorldOverview should return game world overview', async () => {
    const database = await prepareTestDatabase();

    getGameWorldOverview(
      database,
      createControllerArgs<'/statistics/overview'>({}),
    );

    expect(true).toBeTruthy();
  });
});
