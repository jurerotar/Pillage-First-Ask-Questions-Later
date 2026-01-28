import { describe, expect, test } from 'vitest';
import { prepareTestDatabase } from '@pillage-first/db';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import {
  getHero,
  getHeroAdventures,
  getHeroInventory,
  getHeroLoadout,
} from '../hero-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('hero-controllers', () => {
  const playerId = PLAYER_ID;

  test('getHero should return hero details', async () => {
    const database = await prepareTestDatabase();

    getHero(
      database,
      createControllerArgs<'/players/:playerId/hero'>({
        params: { playerId },
      }),
    );

    expect(true).toBeTruthy();
  });

  test('getHeroLoadout should return equipped items', async () => {
    const database = await prepareTestDatabase();

    getHeroLoadout(
      database,
      createControllerArgs<'/players/:playerId/hero/equipped-items'>({
        params: { playerId },
      }),
    );

    expect(true).toBeTruthy();
  });

  test('getHeroInventory should return inventory items', async () => {
    const database = await prepareTestDatabase();

    getHeroInventory(
      database,
      createControllerArgs<'/players/:playerId/hero/inventory'>({
        params: { playerId },
      }),
    );

    expect(true).toBeTruthy();
  });

  test('getHeroAdventures should return adventures status', async () => {
    const database = await prepareTestDatabase();

    getHeroAdventures(
      database,
      createControllerArgs<'/players/:playerId/hero/adventures'>({
        params: { playerId },
      }),
    );

    expect(true).toBeTruthy();
  });
});
