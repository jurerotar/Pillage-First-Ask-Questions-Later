import { z } from 'zod';
import {
  troopMovementItemDtoSchema,
  troopMovementStatsItemDtoSchema,
} from '@pillage-first/types/dtos/troop-movement';
import type { TroopMovementEvent } from '@pillage-first/types/models/game-event';
import { unitIdSchema } from '@pillage-first/types/models/unit';
import {
  deleteEventByIdQuery,
  selectEventByIdQuery,
  selectTroopMovementStatsByVillageIdQuery,
  selectTroopMovementsByVillageIdQuery,
} from '../../queries/event-queries';
import { createEvents } from '../../utils/create-event.ts';
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
} from './schemas/troop-movement-schemas';

export const validateTroopMovement = createController(
  '/troop-movements/validate',
  'post',
  {
    summary: 'Validate troop movement',
    requestBody: z.strictObject({
      type: z.string(),
      villageId: z.number(),
      targetCoordinates: z.strictObject({
        x: z.number(),
        y: z.number(),
      }),
      troops: z.array(
        z.strictObject({
          unitId: unitIdSchema,
          amount: z.number(),
        }),
      ),
    }),
    response: z.strictObject({
      errors: z.array(z.string()),
    }),
  },
)(({ database, body }) => {
  const errors = validateTroopMovementLogic(
    database,
    body as Partial<TroopMovementEvent>,
  );

  return { errors };
});

export const getVillageTroopMovements = createController(
  '/villages/:villageId/troop-movements',
  {
    summary: 'Get village troop movements',
    requestParams: {
      path: z.strictObject({
        villageId: z.coerce.number(),
      }),
    },
    response: z.array(troopMovementItemDtoSchema),
  },
)(({ database, path: { villageId } }) => {
  const rows = database.selectObjects({
    sql: selectTroopMovementsByVillageIdQuery,
    bind: {
      $village_id: villageId,
    },
    schema: getVillageTroopMovementsRowSchema,
  });

  return rows.map(mapTroopMovementRowToDto);
});

export const getVillageTroopMovementStats = createController(
  '/villages/:villageId/troop-movements/stats',
  {
    summary: 'Get village troop movement stats',
    requestParams: {
      path: z.strictObject({
        villageId: z.coerce.number(),
      }),
    },
    response: z.array(troopMovementStatsItemDtoSchema),
  },
)(({ database, path: { villageId } }) => {
  const rows = database.selectObjects({
    sql: selectTroopMovementStatsByVillageIdQuery,
    bind: {
      $village_id: villageId,
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
    const movementEvent = mapEventRowToTypedEvent(
      eventRow!,
    ) as TroopMovementEvent;

    if (!movementEvent) {
      throw new Error('Movement event not found');
    }

    if (movementEvent.type === 'troopMovementReturn') {
      throw new Error('Cannot cancel a return movement');
    }

    const { troops, targetCoordinates, originCoordinates, villageId, type } =
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
      targetCoordinates,
      originCoordinates,
      originalMovementType: type,
    });
  });

  triggerKick();
});
