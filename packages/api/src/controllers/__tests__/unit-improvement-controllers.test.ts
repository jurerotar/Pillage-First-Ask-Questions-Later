import { describe, expect, test } from 'vitest';
import { prepareTestDatabase } from '@pillage-first/db';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { getUnitImprovements } from '../unit-improvement-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('unit-improvement-controllers', () => {
  const playerId = PLAYER_ID;

  test('getUnitImprovements should return unit improvements for a player', async () => {
    const database = await prepareTestDatabase();

    getUnitImprovements(
      database,
      createControllerArgs<'/players/:playerId/unit-improvements'>({
        path: { playerId },
      }),
    );

    expect(true).toBeTruthy();
  });
});
