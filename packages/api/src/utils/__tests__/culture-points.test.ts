import { expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import {
  addPlayerCulturePoints,
  calculatePlayerCulturePointsProduction,
  updatePlayerCulturePointsAt,
} from '../culture-points';

test('new worlds seed and accrue culture points only for PLAYER_ID', async () => {
  const database = await prepareTestDatabase();

  const createdAt = database.selectValue({
    sql: 'SELECT created_at FROM servers;',
    schema: z.number(),
  })!;

  const selectPoints = () =>
    database.selectObjects({
      sql: 'SELECT * FROM culture_points;',
      schema: z.strictObject({
        player_id: z.number(),
        culture_points: z.number(),
        culture_points_updated_at: z.number(),
      }),
    });

  expect(selectPoints()).toEqual([
    {
      player_id: PLAYER_ID,
      culture_points: 0,
      culture_points_updated_at: createdAt,
    },
  ]);

  const timestamp = createdAt + 24 * 60 * 60 * 1000;
  const production = calculatePlayerCulturePointsProduction(database);

  expect(production).toBeGreaterThan(0);

  expect(updatePlayerCulturePointsAt(database, timestamp)).toBe(production);
  addPlayerCulturePoints(database, 500, timestamp);

  expect(selectPoints()).toEqual([
    {
      player_id: PLAYER_ID,
      culture_points: production + 500,
      culture_points_updated_at: timestamp,
    },
  ]);

  expect(
    updatePlayerCulturePointsAt(database, timestamp + 1000, 2),
  ).toBeUndefined();
  addPlayerCulturePoints(database, 500, timestamp + 1000, 2);
  expect(updatePlayerCulturePointsAt(database, timestamp - 1000)).toBe(
    production + 500,
  );

  expect(selectPoints()).toEqual([
    {
      player_id: PLAYER_ID,
      culture_points: production + 500,
      culture_points_updated_at: timestamp,
    },
  ]);
});
