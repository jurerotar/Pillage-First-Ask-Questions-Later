import { z } from 'zod';
import {
  troopMovementItemDtoSchema,
  troopMovementStatsItemDtoSchema,
} from '@pillage-first/types/dtos/troop-movement';
import type { TroopMovementEvent } from '@pillage-first/types/models/game-event';
import {
  deleteEventByIdQuery,
  selectEventByIdQuery,
  selectTroopMovementStatsByTileIdQuery,
  selectTroopMovementsByTileIdQuery,
} from '../../queries/event-queries';
import { selectVillageIdByTileIdQuery } from '../../queries/village-queries';
import { createEvents } from '../../utils/create-event';
import { validateTroopMovement as validateTroopMovementLogic } from '../../utils/troops';
import {
  baseEventRowSchema,
  mapEventRowToTypedEvent,
} from '../../utils/zod/event-schemas';
import { createController } from '../controller';
import { triggerKick } from '../events/scheduler/scheduler-signal';
import {
  mapTroopMovementRowToDto,
  mapTroopMovementStatsRowToDto,
} from './mappers/troop-movement-mapper';
import {
  getVillageTroopMovementStatsRowSchema,
  getVillageTroopMovementsRowSchema,
  troopMovementValidationBodySchema,
} from './schemas/troop-movement-schemas';

export const validateTroopMovement = createController(
  '/troop-movements/validate',
  'post',
  {
    summary: 'Validate troop movement',
    requestBody: troopMovementValidationBodySchema,
    response: z.strictObject({
      errors: z.array(z.string()),
    }),
  },
)(({ database, body: { originTileId, ...body } }) => {
  const villageId = database.selectValue({
    sql: selectVillageIdByTileIdQuery,
    bind: {
      $tile_id: originTileId,
    },
    schema: z.number().nullable(),
  });

  const errors = validateTroopMovementLogic(database, {
    ...body,
    originTileId,
    villageId: villageId ?? undefined,
  } as Partial<TroopMovementEvent>);

  return { errors };
});

export const getVillageTroopMovements = createController(
  '/tiles/:tileId/troop-movements',
  {
    summary: 'Get tile troop movements',
    requestParams: {
      path: z.strictObject({
        tileId: z.coerce.number(),
      }),
    },
    response: z.array(troopMovementItemDtoSchema),
  },
)(({ database, path: { tileId } }) => {
  const rows = database.selectObjects({
    sql: selectTroopMovementsByTileIdQuery,
    bind: {
      $tile_id: tileId,
    },
    schema: getVillageTroopMovementsRowSchema,
  });

  return rows.map(mapTroopMovementRowToDto);
});

export const getVillageTroopMovementStats = createController(
  '/tiles/:tileId/troop-movements/stats',
  {
    summary: 'Get tile troop movement stats',
    requestParams: {
      path: z.strictObject({
        tileId: z.coerce.number(),
      }),
    },
    response: z.array(troopMovementStatsItemDtoSchema),
  },
)(({ database, path: { tileId } }) => {
  const rows = database.selectObjects({
    sql: selectTroopMovementStatsByTileIdQuery,
    bind: {
      $tile_id: tileId,
    },
    schema: getVillageTroopMovementStatsRowSchema,
  });

  return rows.map(mapTroopMovementStatsRowToDto);
});

export const cancelTroopMovement = createController(
  '/troop-movements/:eventId',
  'delete',
  {
    summary: 'Cancel troop movement',
    requestParams: {
      path: z.strictObject({
        eventId: z.coerce.number(),
      }),
    },
  },
)(({ database, path: { eventId } }) => {
  database.transaction((db) => {
    const eventRow = db.selectObject({
      sql: selectEventByIdQuery,
      bind: { $event_id: eventId },
      schema: baseEventRowSchema,
    });

    if (!eventRow) {
      throw new Error('Movement event not found');
    }

    const movementEvent = mapEventRowToTypedEvent(
      eventRow,
    ) as TroopMovementEvent;

    if (movementEvent.type === 'troopMovementReturn') {
      throw new Error('Cannot cancel a return movement');
    }

    const { troops, targetTileId, originTileId, villageId, type } =
      movementEvent;

    const now = Date.now();
    const duration = now - movementEvent.startsAt;

    if (duration > 60_000) {
      throw new Error(
        'Movements can only be cancelled within 1 minute of dispatch',
      );
    }

    db.exec({
      sql: deleteEventByIdQuery,
      bind: { $event_id: eventId },
    });

    createEvents<'troopMovementReturn'>(db, {
      type: 'troopMovementReturn',
      villageId,
      troops,
      startsAt: now,
      duration,
      targetTileId: originTileId,
      originTileId: targetTileId,
      originalMovementType: type,
    });
  });

  triggerKick();
});
