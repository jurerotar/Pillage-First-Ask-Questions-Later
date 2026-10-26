import { afterEach, describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/api/testing';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { GameEventType } from '@pillage-first/types/models/game-event';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import {
  cancelTroopMovement,
  getTileTroopMovements,
  getVillageTroopMovementStats,
  getVillageTroopMovements,
  validateTroopMovement,
} from '../troop-movement-controllers';
import { createControllerArgs } from './utils/controller-args';

describe('troop-movement-controllers', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const getPlayerVillage = (database: DbFacade) =>
    database.selectObject({
      sql: `
        SELECT id, tile_id
        FROM villages
        WHERE player_id = $player_id
        ORDER BY id
        LIMIT 1
      `,
      bind: { $player_id: PLAYER_ID },
      schema: z.strictObject({ id: z.number(), tile_id: z.number() }),
    })!;

  const createVillage = (
    database: DbFacade,
    name: string,
  ): { id: number; tile_id: number } => {
    const tileId = database.selectValue({
      sql: `
        SELECT id
        FROM tiles
        WHERE id NOT IN (SELECT tile_id FROM villages)
        ORDER BY id
        LIMIT 1
      `,
      schema: z.number(),
    })!;

    const villageId = database.selectValue({
      sql: `
        INSERT INTO villages (name, slug, tile_id, player_id)
        VALUES ($name, $slug, $tile_id, $player_id)
        RETURNING id
      `,
      bind: {
        $name: name,
        $slug: `${name.toLowerCase().replaceAll(' ', '-')}-${tileId}`,
        $tile_id: tileId,
        $player_id: PLAYER_ID,
      },
      schema: z.number(),
    })!;

    return { id: villageId, tile_id: tileId };
  };

  const insertTroopMovementEvent = (
    database: DbFacade,
    args: {
      type: GameEventType;
      villageId: number;
      originTileId: number;
      targetTileId: number;
      startsAt: number;
      duration: number;
      originalMovementType?: GameEventType;
    },
  ) =>
    database.selectValue({
      sql: `
        INSERT INTO events (type, starts_at, duration, village_id, meta)
        VALUES ($type, $starts_at, $duration, $village_id, $meta)
        RETURNING id
      `,
      bind: {
        $type: args.type,
        $starts_at: args.startsAt,
        $duration: args.duration,
        $village_id: args.villageId,
        $meta: JSON.stringify({
          originTileId: args.originTileId,
          targetTileId: args.targetTileId,
          troops: [
            {
              unitId: 'LEGIONNAIRE',
              amount: 3,
              tileId: args.originTileId,
              sourceTileId: args.originTileId,
            },
          ],
          ...(args.originalMovementType
            ? { originalMovementType: args.originalMovementType }
            : {}),
        }),
      },
      schema: z.number(),
    })!;

  test('validateTroopMovement should return validation errors', async () => {
    using database = await prepareTestDatabase();
    const village = getPlayerVillage(database);

    const result = validateTroopMovement(
      database,
      createControllerArgs<'/troop-movements/validate', 'post'>({
        body: {
          type: 'troopMovementAttack',
          originTileId: village.tile_id,
          targetTileId: 999_999,
          troops: [{ unitId: 'LEGIONNAIRE', amount: 1 }],
        },
      }),
    );

    expect(result.errors).toContain('Target tile does not exist');
    expect(result.errors).toContain('Target must be a village or an oasis');
  });

  test('getVillageTroopMovements should return outgoing and incoming movements', async () => {
    using database = await prepareTestDatabase();
    database.exec({ sql: 'DELETE FROM events' });

    const currentVillage = getPlayerVillage(database);
    const targetVillage = createVillage(database, 'Movement Target');

    insertTroopMovementEvent(database, {
      type: 'troopMovementAttack',
      villageId: currentVillage.id,
      originTileId: currentVillage.tile_id,
      targetTileId: targetVillage.tile_id,
      startsAt: 1000,
      duration: 500,
    });

    insertTroopMovementEvent(database, {
      type: 'troopMovementReinforcements',
      villageId: targetVillage.id,
      originTileId: targetVillage.tile_id,
      targetTileId: currentVillage.tile_id,
      startsAt: 2000,
      duration: 500,
    });

    const result = getVillageTroopMovements(
      database,
      createControllerArgs<'/tiles/:tileId/troop-movements'>({
        path: { tileId: currentVillage.tile_id },
      }),
    );

    expect(result).toHaveLength(2);
    expect(result.map(({ type }) => type)).toStrictEqual([
      'troopMovementAttack',
      'troopMovementReinforcements',
    ]);
    expect(result[0]).toMatchObject({
      originatingVillageId: currentVillage.id,
      targetTileId: targetVillage.tile_id,
    });
    expect(result[1]).toMatchObject({
      originatingVillageId: targetVillage.id,
      targetTileId: currentVillage.tile_id,
    });
  });

  test('tile movements include other villages, incoming attacks, and returns while excluding unrelated routes', async () => {
    using database = await prepareTestDatabase();
    using _clock = vi.spyOn(Date, 'now').mockReturnValue(1000);

    database.exec({ sql: 'DELETE FROM events;' });

    const home = getPlayerVillage(database);
    const secondHome = createVillage(database, 'Second Home');

    const enemy = database.selectObject({
      sql: 'SELECT id, tile_id FROM villages WHERE player_id != 1 LIMIT 1;',
      schema: z.strictObject({ id: z.number(), tile_id: z.number() }),
    })!;

    const base = {
      villageId: home.id,
      originTileId: home.tile_id,
      targetTileId: enemy.tile_id,
      startsAt: 0,
      duration: 4000,
    };

    const raidId = insertTroopMovementEvent(database, {
      ...base,
      type: 'troopMovementRaid',
    });

    const secondRaidId = insertTroopMovementEvent(database, {
      ...base,
      type: 'troopMovementAttack',
      villageId: secondHome.id,
      originTileId: secondHome.tile_id,
      duration: 2000,
    });

    const returnId = insertTroopMovementEvent(database, {
      ...base,
      type: 'troopMovementReturn',
      originTileId: enemy.tile_id,
      targetTileId: home.tile_id,
      duration: 3000,
      originalMovementType: 'troopMovementRaid',
    });

    const incomingId = insertTroopMovementEvent(database, {
      ...base,
      type: 'troopMovementAttack',
      villageId: enemy.id,
      originTileId: enemy.tile_id,
      targetTileId: home.tile_id,
      duration: 1500,
    });

    insertTroopMovementEvent(database, {
      ...base,
      type: 'troopMovementRaid',
      villageId: enemy.id,
    });
    insertTroopMovementEvent(database, {
      ...base,
      type: 'troopMovementRaid',
      duration: 1000,
    });
    insertTroopMovementEvent(database, {
      ...base,
      type: 'troopMovementRaid',
      startsAt: 2000,
    });
    insertTroopMovementEvent(database, { ...base, type: 'resourceTransfer' });
    insertTroopMovementEvent(database, {
      ...base,
      type: 'troopMovementAdventure',
    });
    insertTroopMovementEvent(database, {
      ...base,
      type: 'troopMovementRaid',
      targetTileId: secondHome.tile_id,
    });

    const movements = getTileTroopMovements(
      database,
      createControllerArgs<'/tiles/:tileId/movements'>({
        path: { tileId: enemy.tile_id },
      }),
    );

    expect(movements.map(({ id }) => id)).toEqual([
      incomingId,
      secondRaidId,
      returnId,
      raidId,
    ]);
  });

  test('tile movements include attacks arriving at owned oases', async () => {
    using database = await prepareTestDatabase();
    using _clock = vi.spyOn(Date, 'now').mockReturnValue(1000);

    database.exec({ sql: 'DELETE FROM events;' });

    const home = getPlayerVillage(database);

    const enemy = database.selectObject({
      sql: 'SELECT id, tile_id FROM villages WHERE player_id != 1 LIMIT 1;',
      schema: z.strictObject({ id: z.number(), tile_id: z.number() }),
    })!;

    const oasisTileId = database.selectValue({
      sql: 'SELECT tile_id FROM oasis LIMIT 1;',
      schema: z.number(),
    })!;

    database.exec({
      sql: 'UPDATE oasis SET village_id = $village_id WHERE tile_id = $tile_id;',
      bind: { $village_id: home.id, $tile_id: oasisTileId },
    });

    const eventId = insertTroopMovementEvent(database, {
      type: 'troopMovementAttack',
      villageId: enemy.id,
      originTileId: enemy.tile_id,
      targetTileId: oasisTileId,
      startsAt: 0,
      duration: 2000,
    });

    expect(
      getTileTroopMovements(
        database,
        createControllerArgs<'/tiles/:tileId/movements'>({
          path: { tileId: oasisTileId },
        }),
      ).map(({ id }) => id),
    ).toEqual([eventId]);
  });

  test('movement routes distinguish the actual return origin from the home village', async () => {
    using database = await prepareTestDatabase();
    using _clock = vi.spyOn(Date, 'now').mockReturnValue(1000);

    database.exec({ sql: 'DELETE FROM events;' });

    const home = getPlayerVillage(database);
    const target = createVillage(database, 'Return Origin');

    const eventId = insertTroopMovementEvent(database, {
      type: 'troopMovementReturn',
      villageId: home.id,
      originTileId: target.tile_id,
      targetTileId: home.tile_id,
      startsAt: 1000,
      duration: 500,
      originalMovementType: 'troopMovementRaid',
    });

    const movements = getTileTroopMovements(
      database,
      createControllerArgs<'/tiles/:tileId/movements'>({
        path: { tileId: home.tile_id },
      }),
    );

    const coordinates = (tileId: number) =>
      database.selectObject({
        sql: 'SELECT x, y FROM tiles WHERE id = $tile_id;',
        bind: { $tile_id: tileId },
        schema: z.strictObject({ x: z.number(), y: z.number() }),
      });

    expect(movements).toEqual([
      expect.objectContaining({
        id: eventId,
        originName: 'Return Origin',
        originCoordinates: coordinates(target.tile_id),
        targetTileId: home.tile_id,
        targetCoordinates: coordinates(home.tile_id),
      }),
    ]);
  });

  test('getVillageTroopMovementStats should group movements by direction and purpose', async () => {
    using database = await prepareTestDatabase();
    database.exec({ sql: 'DELETE FROM events' });

    const currentVillage = getPlayerVillage(database);
    const targetVillage = createVillage(database, 'Stats Target');

    insertTroopMovementEvent(database, {
      type: 'troopMovementAttack',
      villageId: currentVillage.id,
      originTileId: currentVillage.tile_id,
      targetTileId: targetVillage.tile_id,
      startsAt: 1000,
      duration: 500,
    });

    insertTroopMovementEvent(database, {
      type: 'troopMovementReinforcements',
      villageId: targetVillage.id,
      originTileId: targetVillage.tile_id,
      targetTileId: currentVillage.tile_id,
      startsAt: 2000,
      duration: 700,
    });

    const result = getVillageTroopMovementStats(
      database,
      createControllerArgs<'/tiles/:tileId/troop-movements/stats'>({
        path: { tileId: currentVillage.tile_id },
      }),
    );

    expect(result).toStrictEqual(
      expect.arrayContaining([
        {
          type: 'offensiveMovementOutgoing',
          count: 1,
          earliestResolvesAt: 1500,
        },
        {
          type: 'deploymentIncoming',
          count: 1,
          earliestResolvesAt: 2700,
        },
      ]),
    );
  });

  test('cancelTroopMovement should delete the movement and create a return movement', async () => {
    using database = await prepareTestDatabase();
    database.exec({ sql: 'DELETE FROM events' });

    vi.setSystemTime(new Date(1_000_000));

    const currentVillage = getPlayerVillage(database);
    const targetVillage = createVillage(database, 'Cancel Target');
    const eventId = insertTroopMovementEvent(database, {
      type: 'troopMovementAttack',
      villageId: currentVillage.id,
      originTileId: currentVillage.tile_id,
      targetTileId: targetVillage.tile_id,
      startsAt: 970_000,
      duration: 120_000,
    });

    cancelTroopMovement(
      database,
      createControllerArgs<'/troop-movements/:eventId', 'delete'>({
        path: { eventId },
      }),
    );

    const attackEventCount = database.selectValue({
      sql: "SELECT COUNT(*) FROM events WHERE type = 'troopMovementAttack'",
      schema: z.number(),
    });

    const returnEvent = database.selectObject({
      sql: `
        SELECT
          type,
          starts_at,
          duration,
          JSON_EXTRACT(meta, '$.originTileId') AS origin_tile_id,
          JSON_EXTRACT(meta, '$.targetTileId') AS target_tile_id,
          JSON_EXTRACT(meta, '$.originalMovementType') AS original_movement_type
        FROM events
        WHERE type = 'troopMovementReturn'
      `,
      schema: z.strictObject({
        type: z.string(),
        starts_at: z.number(),
        duration: z.number(),
        origin_tile_id: z.number(),
        target_tile_id: z.number(),
        original_movement_type: z.string(),
      }),
    })!;

    expect(attackEventCount).toBe(0);
    expect(returnEvent.type).toBe('troopMovementReturn');
    expect(returnEvent.starts_at).toBe(1_000_000);
    expect(returnEvent.duration).toBe(30_000);
    expect(returnEvent.origin_tile_id).toBe(targetVillage.tile_id);
    expect(returnEvent.target_tile_id).toBe(currentVillage.tile_id);
    expect(returnEvent.original_movement_type).toBe('troopMovementAttack');
  });

  test('cancelTroopMovement should reject missing movement events', async () => {
    using database = await prepareTestDatabase();

    expect(() =>
      cancelTroopMovement(
        database,
        createControllerArgs<'/troop-movements/:eventId', 'delete'>({
          path: { eventId: 999_999 },
        }),
      ),
    ).toThrow('Movement event not found');
  });

  test('cancelTroopMovement should reject return movements', async () => {
    using database = await prepareTestDatabase();
    database.exec({ sql: 'DELETE FROM events' });

    const currentVillage = getPlayerVillage(database);
    const targetVillage = createVillage(database, 'Return Target');
    const eventId = insertTroopMovementEvent(database, {
      type: 'troopMovementReturn',
      villageId: currentVillage.id,
      originTileId: targetVillage.tile_id,
      targetTileId: currentVillage.tile_id,
      startsAt: 1000,
      duration: 500,
      originalMovementType: 'troopMovementAttack',
    });

    expect(() =>
      cancelTroopMovement(
        database,
        createControllerArgs<'/troop-movements/:eventId', 'delete'>({
          path: { eventId },
        }),
      ),
    ).toThrow('Cannot cancel a return movement');
  });

  test('cancelTroopMovement should reject movements older than one minute', async () => {
    using database = await prepareTestDatabase();
    database.exec({ sql: 'DELETE FROM events' });

    vi.setSystemTime(new Date(1_000_000));

    const currentVillage = getPlayerVillage(database);
    const targetVillage = createVillage(database, 'Expired Target');
    const eventId = insertTroopMovementEvent(database, {
      type: 'troopMovementAttack',
      villageId: currentVillage.id,
      originTileId: currentVillage.tile_id,
      targetTileId: targetVillage.tile_id,
      startsAt: 938_999,
      duration: 120_000,
    });

    expect(() =>
      cancelTroopMovement(
        database,
        createControllerArgs<'/troop-movements/:eventId', 'delete'>({
          path: { eventId },
        }),
      ),
    ).toThrow('Movements can only be cancelled within 1 minute of dispatch');
  });
});
