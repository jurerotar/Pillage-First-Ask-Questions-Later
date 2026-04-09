import type { TroopMovementEvent } from '@pillage-first/types/models/game-event';
import { triggerKick } from '../scheduler/scheduler-signal';
import { createController } from '../utils/controller';
import {
  selectEventByIdQuery,
  selectTroopMovementStatsByVillageIdQuery,
  selectTroopMovementsByVillageIdQuery,
} from '../utils/queries/event-queries';
import { eventSchema } from '../utils/zod/event-schemas';
import { validateTroopMovementLogic } from '../utils/zod/troop-movement-validation-schema';
import {
  getVillageTroopMovementStatsSchema,
  getVillageTroopMovementsSchema,
} from './schemas/troop-movement-schemas';
import { createEvents } from './utils/create-event';

export const validateTroopMovement = createController(
  '/troop-movements/validate',
  'post',
)(({ database, body }) => {
  const errors = validateTroopMovementLogic(
    database,
    body as Partial<TroopMovementEvent>,
  );

  return { errors };
});

export const getVillageTroopMovements = createController(
  '/villages/:villageId/troop-movements',
)(({ database, path: { villageId } }) => {
  return database.selectObjects({
    sql: selectTroopMovementsByVillageIdQuery,
    bind: {
      $village_id: villageId,
    },
    schema: getVillageTroopMovementsSchema,
  });
});

export const getVillageTroopMovementStats = createController(
  '/villages/:villageId/troop-movements/stats',
)(({ database, path: { villageId } }) => {
  return database.selectObjects({
    sql: selectTroopMovementStatsByVillageIdQuery,
    bind: {
      $village_id: villageId,
    },
    schema: getVillageTroopMovementStatsSchema,
  });
});

export const cancelTroopMovement = createController(
  '/troop-movements/:eventId',
  'delete',
)(({ database, path: { eventId } }) => {
  database.transaction((db) => {
    const movementEvent = db.selectObject({
      sql: selectEventByIdQuery,
      bind: { $event_id: eventId },
      schema: eventSchema,
    }) as TroopMovementEvent;

    if (!movementEvent) {
      throw new Error('Movement event not found');
    }

    if (movementEvent.type === 'troopMovementReturn') {
      throw new Error('Cannot cancel a return movement');
    }

    const now = Date.now();
    const duration = now - movementEvent.startsAt;

    if (duration > 60000) {
      throw new Error(
        'Movements can only be cancelled within 1 minute of dispatch',
      );
    }

    db.exec({
      sql: 'DELETE FROM events WHERE id = $event_id',
      bind: { $event_id: eventId },
    });

    createEvents(db, {
      ...movementEvent,
      type: 'troopMovementReturn',
      startsAt: now,
      duration,
      targetCoordinates: movementEvent.originCoordinates,
      originCoordinates: movementEvent.targetCoordinates,
    });
  });

  triggerKick();
});
