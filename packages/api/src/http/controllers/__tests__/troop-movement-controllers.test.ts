import { afterEach, describe, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { prepareTestDatabase } from '@pillage-first/db';
import { PLAYER_ID } from '@pillage-first/game-assets/player';
import type { GameEventType } from '@pillage-first/types/models/game-event';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import {
  cancelTroopMovement,
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
              source: args.originTileId,
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
    const database = await prepareTestDatabase();
    const village = getPlayerVillage(database);

    const result = validateTroopMovement(
      database,
      createControllerArgs<'/troop-movements/validate', 'post'>({
        body: {
          type: 'troopMovementAttack',
          villageId: village.id,
          targetTileId: 999_999,
          troops: [{ unitId: 'LEGIONNAIRE', amount: 1 }],
        },
      }),
    );

    expect(result.errors).toContain('Target tile does not exist');
    expect(result.errors).toContain('Target must be a village or an oasis');
  });

  test('getVillageTroopMovements should return outgoing and incoming movements', async () => {
    const database = await prepareTestDatabase();
    database.exec({ sql: 'DELETE FROM events' });

    const currentVillage = getPlayerVillage(database);
    const targetVillage = createVillage(database, 'Movement Target');

    insertTroopMovementEvent(database, {
      type: 'troopMovementAttack',
      villageId: currentVillage.id,
      originTileId: currentVillage.tile_id,
      targetTileId: targetVillage.tile_id,
      startsAt: 1_000,
      duration: 500,
    });

    insertTroopMovementEvent(database, {
      type: 'troopMovementReinforcements',
      villageId: targetVillage.id,
      originTileId: targetVillage.tile_id,
      targetTileId: currentVillage.tile_id,
      startsAt: 2_000,
      duration: 500,
    });

    const result = getVillageTroopMovements(
      database,
      createControllerArgs<'/villages/:villageId/troop-movements'>({
        path: { villageId: currentVillage.id },
      }),
    );

    expect(result).toHaveLength(2);
    expect(result.map(({ type }) => type)).toEqual([
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

  test('getVillageTroopMovementStats should group movements by direction and purpose', async () => {
    const database = await prepareTestDatabase();
    database.exec({ sql: 'DELETE FROM events' });

    const currentVillage = getPlayerVillage(database);
    const targetVillage = createVillage(database, 'Stats Target');

    insertTroopMovementEvent(database, {
      type: 'troopMovementAttack',
      villageId: currentVillage.id,
      originTileId: currentVillage.tile_id,
      targetTileId: targetVillage.tile_id,
      startsAt: 1_000,
      duration: 500,
    });

    insertTroopMovementEvent(database, {
      type: 'troopMovementReinforcements',
      villageId: targetVillage.id,
      originTileId: targetVillage.tile_id,
      targetTileId: currentVillage.tile_id,
      startsAt: 2_000,
      duration: 700,
    });

    const result = getVillageTroopMovementStats(
      database,
      createControllerArgs<'/villages/:villageId/troop-movements/stats'>({
        path: { villageId: currentVillage.id },
      }),
    );

    expect(result).toEqual(
      expect.arrayContaining([
        {
          type: 'offensiveMovementOutgoing',
          count: 1,
          earliestResolvesAt: 1_500,
        },
        {
          type: 'deploymentIncoming',
          count: 1,
          earliestResolvesAt: 2_700,
        },
      ]),
    );
  });

  test('cancelTroopMovement should delete the movement and create a return movement', async () => {
    const database = await prepareTestDatabase();
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
    const database = await prepareTestDatabase();

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
    const database = await prepareTestDatabase();
    database.exec({ sql: 'DELETE FROM events' });

    const currentVillage = getPlayerVillage(database);
    const targetVillage = createVillage(database, 'Return Target');
    const eventId = insertTroopMovementEvent(database, {
      type: 'troopMovementReturn',
      villageId: currentVillage.id,
      originTileId: targetVillage.tile_id,
      targetTileId: currentVillage.tile_id,
      startsAt: 1_000,
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
    const database = await prepareTestDatabase();
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
