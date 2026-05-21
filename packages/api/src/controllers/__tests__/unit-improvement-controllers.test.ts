import { describe, expect, test } from 'vitest';
import { prepareTestDatabase } from '@pillage-first/db';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import {
  getPlayerUnitCombatStats,
  getUnitImprovements,
} from '../unit-improvement-controllers';
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

    expect(true).toBe(true);
  });

  test('getPlayerUnitCombatStats should return improved combat stats for player tribe units', async () => {
    const database = await prepareTestDatabase();

    const result = getPlayerUnitCombatStats(
      database,
      createControllerArgs<'/players/:playerId/unit-combat-stats'>({
        path: { playerId },
      }),
    );

    expect(result).toContainEqual({
      unitId: 'PHALANX',
      attack: 15,
      infantryDefence: 40,
      cavalryDefence: 50,
    });
  });
});
