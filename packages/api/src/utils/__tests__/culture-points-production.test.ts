import { expect, test } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/api/testing';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import {
  createBuildingDestructionEventMock,
  createBuildingLevelChangeEventMock,
  createTroopMovementFindNewVillageEventMock,
} from '@pillage-first/mocks/event';
import {
  buildingDestructionResolver,
  buildingLevelChangeResolver,
} from '../../http/events/resolvers/building-resolvers';
import { findNewVillageMovementResolver } from '../../http/events/resolvers/troop-movement-resolver';
import {
  calculatePlayerCulturePointsProduction,
  updatePlayerCulturePointsAt,
} from '../culture-points';

const DAY = 86_400_000;

test('building changes preserve fractional accrual and settle at the event timestamp', async () => {
  const cases = [
    { change: 'upgrade', buildingId: 'MAIN_BUILDING', level: 1, nextLevel: 20 },
    {
      change: 'downgrade',
      buildingId: 'MAIN_BUILDING',
      level: 20,
      nextLevel: 1,
    },
    {
      change: 'destruction',
      buildingId: 'MAIN_BUILDING',
      level: 20,
      nextLevel: 0,
    },
    {
      change: 'destruction',
      buildingId: 'WOODCUTTER',
      level: 20,
      nextLevel: 0,
    },
  ] as const;

  for (const { change, buildingId, level, nextLevel } of cases) {
    using database = await prepareTestDatabase();

    const field = database.selectObject({
      sql: `
        SELECT bf.village_id AS villageId, bf.field_id AS buildingFieldId
        FROM building_fields bf
          JOIN villages v ON v.id = bf.village_id
          JOIN building_ids bi ON bi.id = bf.building_id
        WHERE v.player_id = $player_id AND bi.building = $building_id
        LIMIT 1;
      `,
      bind: { $player_id: PLAYER_ID, $building_id: buildingId },
      schema: z.strictObject({
        villageId: z.number(),
        buildingFieldId: z.number(),
      }),
    })!;

    database.exec({
      sql: 'UPDATE building_fields SET level = $level WHERE village_id = $village_id AND field_id = $field_id;',
      bind: {
        $level: level,
        $village_id: field.villageId,
        $field_id: field.buildingFieldId,
      },
    });

    const start = database.selectValue({
      sql: 'SELECT culture_points_updated_at FROM culture_points;',
      schema: z.number(),
    })!;

    const before = calculatePlayerCulturePointsProduction(database);

    expect(before).toBeGreaterThan(0);
    expect(updatePlayerCulturePointsAt(database, start + 1_000)).toBeCloseTo(
      before / 86_400,
      10,
    );
    expect(updatePlayerCulturePointsAt(database, start + 2_000)).toBeCloseTo(
      (before * 2) / 86_400,
      10,
    );

    const args = {
      ...field,
      buildingId,
      previousLevel: level,
      level: nextLevel,
      startsAt: start,
      duration: DAY / 2,
    };

    if (change === 'destruction') {
      buildingDestructionResolver(
        database,
        createBuildingDestructionEventMock(args),
      );
    } else {
      buildingLevelChangeResolver(
        database,
        createBuildingLevelChangeEventMock(args),
      );
    }

    const after = calculatePlayerCulturePointsProduction(database);

    expect(after).not.toBe(before);
    expect(
      database.selectObject({
        sql: 'SELECT culture_points AS points, culture_points_updated_at AS updatedAt FROM culture_points;',
        schema: z.strictObject({ points: z.number(), updatedAt: z.number() }),
      }),
    ).toEqual({ points: before / 2, updatedAt: start + DAY / 2 });
    expect(updatePlayerCulturePointsAt(database, start + DAY)).toBeCloseTo(
      before / 2 + after / 2,
    );
  }
});

test('new village production starts at founding, without changing earlier accrual', async () => {
  using database = await prepareTestDatabase();

  const { villageId, originTileId } = database.selectObject({
    sql: 'SELECT id AS villageId, tile_id AS originTileId FROM villages WHERE player_id = $player_id LIMIT 1;',
    bind: { $player_id: PLAYER_ID },
    schema: z.strictObject({ villageId: z.number(), originTileId: z.number() }),
  })!;

  const targetTileId = database.selectValue({
    sql: `
      SELECT t.id FROM tiles t
      WHERE t.type_id = (SELECT id FROM tile_type_ids WHERE type = 'free')
        AND NOT EXISTS (SELECT 1 FROM villages v WHERE v.tile_id = t.id)
        AND NOT EXISTS (SELECT 1 FROM oasis o WHERE o.tile_id = t.id)
      LIMIT 1;
    `,
    schema: z.number(),
  })!;

  const start = database.selectValue({
    sql: 'SELECT culture_points_updated_at FROM culture_points;',
    schema: z.number(),
  })!;

  const before = calculatePlayerCulturePointsProduction(database);

  findNewVillageMovementResolver(
    database,
    createTroopMovementFindNewVillageEventMock({
      villageId,
      originTileId,
      targetTileId,
      startsAt: start,
      duration: DAY / 2,
    }),
  );

  const after = calculatePlayerCulturePointsProduction(database);

  expect(after).toBeGreaterThan(before);
  expect(updatePlayerCulturePointsAt(database, start + DAY)).toBeCloseTo(
    before / 2 + after / 2,
  );
});
