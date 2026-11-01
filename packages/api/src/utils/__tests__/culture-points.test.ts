import { expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/api/testing';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import { createTroopMovementFindNewVillageEventMock } from '@pillage-first/mocks/event';
import {
  addPlayerCulturePoints,
  calculatePlayerCulturePointsProduction,
  getPlayerCulturePointsRequirementContext,
  updatePlayerCulturePointsAt,
} from '../culture-points';
import { insertEvents } from '../events';
import { validateTroopMovement } from '../troops';

test('new worlds seed and accrue culture points only for PLAYER_ID', async () => {
  const database = await prepareTestDatabase();

  const createdAt = database.selectValue({
    sql: 'SELECT created_at FROM servers;',
    schema: z.number(),
  })!;

  const selectPoints = () =>
    database.selectObjects({
      sql: 'SELECT player_id, culture_points, culture_points_updated_at FROM culture_points;',
      schema: z.strictObject({
        player_id: z.number(),
        culture_points: z.number(),
        culture_points_updated_at: z.number(),
      }),
    });

  expect(selectPoints()).toEqual([
    {
      player_id: PLAYER_ID,
      culture_points: 500,
      culture_points_updated_at: createdAt,
    },
  ]);

  const timestamp = createdAt + 24 * 60 * 60 * 1000;
  const production = calculatePlayerCulturePointsProduction(database);

  expect(production).toBeGreaterThan(0);

  expect(updatePlayerCulturePointsAt(database, timestamp)).toBe(
    production + 500,
  );
  addPlayerCulturePoints(database, 500, timestamp);

  expect(selectPoints()).toEqual([
    {
      player_id: PLAYER_ID,
      culture_points: production + 1000,
      culture_points_updated_at: timestamp,
    },
  ]);

  expect(
    updatePlayerCulturePointsAt(database, timestamp + 1000, 2),
  ).toBeUndefined();
  addPlayerCulturePoints(database, 500, timestamp + 1000, 2);
  expect(updatePlayerCulturePointsAt(database, timestamp - 1000)).toBe(
    production + 1000,
  );

  expect(selectPoints()).toEqual([
    {
      player_id: PLAYER_ID,
      culture_points: production + 1000,
      culture_points_updated_at: timestamp,
    },
  ]);
});

test('pending founding missions reserve culture-point capacity until removed', async () => {
  using database = await prepareTestDatabase();

  const { villageId, originTileId } = database.selectObject({
    sql: 'SELECT id AS villageId, tile_id AS originTileId FROM villages WHERE player_id = $player_id LIMIT 1;',
    bind: { $player_id: PLAYER_ID },
    schema: z.strictObject({ villageId: z.number(), originTileId: z.number() }),
  })!;

  const [firstTarget, secondTarget] = database.selectValues({
    sql: `
      SELECT t.id FROM tiles t
      WHERE NOT EXISTS (SELECT 1 FROM villages v WHERE v.tile_id = t.id)
        AND NOT EXISTS (SELECT 1 FROM oasis o WHERE o.tile_id = t.id)
      LIMIT 2;
    `,
    schema: z.number(),
  });

  const mission = createTroopMovementFindNewVillageEventMock({
    villageId,
    originTileId,
    targetTileId: firstTarget,
    duration: 60_000,
    troops: [
      {
        unitId: 'ROMAN_SETTLER',
        amount: 3,
        tileId: originTileId,
        sourceTileId: originTileId,
      },
    ],
  });

  const initialContext = getPlayerCulturePointsRequirementContext(database);

  database.exec({
    sql: `
      UPDATE culture_points
      SET culture_points = $points, culture_points_updated_at = $now
      WHERE player_id = $player_id;
    `,
    bind: {
      $points: initialContext.nextVillageCulturePointsRequirement,
      $now: Date.now(),
      $player_id: PLAYER_ID,
    },
  });

  expect(validateTroopMovement(database, mission)).toEqual([]);

  insertEvents(database, [mission]);

  const reservedContext = getPlayerCulturePointsRequirementContext(database);

  expect(reservedContext.villageCount).toBe(initialContext.villageCount);
  expect(reservedContext.nextVillageCulturePointsRequirement).toBeGreaterThan(
    initialContext.nextVillageCulturePointsRequirement,
  );

  const secondMission = { ...mission, targetTileId: secondTarget };

  expect(validateTroopMovement(database, secondMission)).toEqual([
    `Not enough culture points. ${reservedContext.nextVillageCulturePointsRequirement} culture points are required to found the next village.`,
  ]);

  addPlayerCulturePoints(
    database,
    reservedContext.nextVillageCulturePointsRequirement -
      initialContext.nextVillageCulturePointsRequirement,
    Date.now(),
  );

  expect(validateTroopMovement(database, secondMission)).toEqual([]);

  database.exec({
    sql: "DELETE FROM events WHERE type = 'troopMovementFindNewVillage' AND village_id = $village_id;",
    bind: { $village_id: villageId },
  });

  expect(getPlayerCulturePointsRequirementContext(database)).toEqual(
    initialContext,
  );
});

test('another player’s founding missions do not reserve the player’s capacity', async () => {
  using database = await prepareTestDatabase();

  const otherVillageId = database.selectValue({
    sql: 'SELECT id FROM villages WHERE player_id != $player_id LIMIT 1;',
    bind: { $player_id: PLAYER_ID },
    schema: z.number(),
  })!;

  const initialContext = getPlayerCulturePointsRequirementContext(database);

  insertEvents(database, [
    createTroopMovementFindNewVillageEventMock({ villageId: otherVillageId }),
  ]);

  expect(getPlayerCulturePointsRequirementContext(database)).toEqual(
    initialContext,
  );
});
