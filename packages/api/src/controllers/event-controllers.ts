import { z } from 'zod';
import { calculateBuildingCancellationRefundForLevel } from '@pillage-first/game-assets/utils/buildings';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { triggerKick } from '../scheduler/scheduler-signal';
import { createController } from '../utils/controller';
import {
  selectAllVillageEventsByTypeQuery,
  selectAllVillageEventsQuery,
  selectEventByIdQuery,
  selectEventsByTypeQuery,
  selectTroopMovementEventsQuery,
} from '../utils/queries/event-queries';
import { addVillageResourcesAt, demolishBuilding } from '../utils/village';
import { eventSchema } from '../utils/zod/event-schemas';
import { scheduledUpgradeSchema } from './schemas/scheduled-upgrades-schemas';
import { createEvents } from './utils/create-event';

export const getScheduledBuildingUpgrades = createController(
  '/villages/:villageId/scheduled-upgrades',
)(({ database, path: { villageId } }) => {
  return database.selectObjects({
    sql: `
      SELECT
        su.id,
        bi.building AS buildingId,
        su.village_id AS villageId,
        su.building_field_id AS buildingFieldId,
        su.level
      FROM
        scheduled_building_upgrades su
          JOIN building_ids bi ON bi.id = su.building_id
      WHERE
        su.village_id = $village_id
      ORDER BY
        su.id ASC;
    `,
    bind: {
      $village_id: villageId,
    },
    schema: scheduledUpgradeSchema,
  });
});

export const scheduleBuildingUpgrade = createController(
  '/villages/:villageId/scheduled-upgrades',
  'post',
)(
  ({
    database,
    path: { villageId },
    body: { buildingId, buildingFieldId, level },
  }) => {
    database.transaction((db) => {
      const count = db.selectValue({
        sql: 'SELECT COUNT(*) FROM scheduled_building_upgrades WHERE village_id = $village_id',
        bind: { $village_id: villageId },
        schema: z.number(),
      })!;

      if (count >= 4) {
        throw new Error('Maximum of 4 scheduled upgrades reached');
      }

      if (level === 0) {
        db.exec({
          sql: `
            INSERT INTO
              building_fields (village_id, field_id, building_id, level)
            VALUES
              ($village_id, $field_id, (
                SELECT id
                FROM building_ids
                WHERE building = $building_id
                ), 0)
          `,
          bind: {
            $village_id: villageId,
            $field_id: buildingFieldId,
            $building_id: buildingId,
          },
        });
      }

      db.exec({
        sql: `
          INSERT INTO
            scheduled_building_upgrades (building_id, village_id, building_field_id, level)
          VALUES
            ((
               SELECT id
               FROM building_ids
               WHERE building = $building_id
               ), $village_id, $building_field_id, $level)
        `,
        bind: {
          $building_id: buildingId,
          $village_id: villageId,
          $building_field_id: buildingFieldId,
          $level: level,
        },
      });
    });

    triggerKick();
  },
);

export const removeScheduledBuildingUpgrade = createController(
  '/villages/:villageId/scheduled-upgrades/:scheduledUpgradeId',
  'delete',
)(({ database, path: { villageId, scheduledUpgradeId } }) => {
  database.transaction((db) => {
    const upgradeToRemove = db.selectObject({
      sql: 'SELECT building_field_id AS buildingFieldId, level FROM scheduled_building_upgrades WHERE id = $id AND village_id = $village_id',
      bind: { $id: scheduledUpgradeId, $village_id: villageId },
      schema: z.object({
        buildingFieldId: z.number(),
        level: z.number(),
      }),
    });

    if (!upgradeToRemove) {
      return;
    }

    // Cancel this one and all higher levels of the same building
    const scheduledUpgradesToRemove = db.selectObjects({
      sql: `
        SELECT level
        FROM
          scheduled_building_upgrades
        WHERE
          village_id = $village_id
          AND building_field_id = $building_field_id
          AND level >= $level
      `,
      bind: {
        $village_id: villageId,
        $building_field_id: upgradeToRemove.buildingFieldId,
        $level: upgradeToRemove.level,
      },
      schema: z.strictObject({ level: z.number() }),
    });

    const hasLevel0 = scheduledUpgradesToRemove.some((u) => u.level === 0);

    db.exec({
      sql: `
        DELETE
        FROM
          scheduled_building_upgrades
        WHERE
          village_id = $village_id
          AND building_field_id = $building_field_id
          AND level >= $level
      `,
      bind: {
        $village_id: villageId,
        $building_field_id: upgradeToRemove.buildingFieldId,
        $level: upgradeToRemove.level,
      },
    });

    if (hasLevel0) {
      db.exec({
        sql: `
          DELETE
          FROM
            building_fields
          WHERE
            village_id = $village_id
            AND field_id = $building_field_id
            AND level = 0
        `,
        bind: {
          $village_id: villageId,
          $building_field_id: upgradeToRemove.buildingFieldId,
        },
      });
    }
  });

  triggerKick();
});

export const getVillageEvents = createController('/villages/:villageId/events')(
  ({ database, path: { villageId } }) => {
    return database.selectObjects({
      sql: selectAllVillageEventsQuery,
      bind: {
        $village_id: villageId,
      },
      schema: eventSchema,
    });
  },
);

export const getVillageEventsByType = createController(
  '/villages/:villageId/events/:eventType',
)(({ database, path: { villageId, eventType } }) => {
  if (eventType === 'troopMovement') {
    return database.selectObjects({
      sql: selectTroopMovementEventsQuery,
      bind: {
        $village_id: villageId,
      },
      schema: eventSchema,
    });
  }

  if (eventType === 'unitImprovement') {
    return database.selectObjects({
      sql: selectEventsByTypeQuery,
      bind: {
        $type: eventType,
      },
      schema: eventSchema,
    });
  }

  return database.selectObjects({
    sql: selectAllVillageEventsByTypeQuery,
    bind: {
      $village_id: villageId,
      $type: eventType,
    },
    schema: eventSchema,
  });
});

export const createNewEvents = createController(
  '/events',
  'post',
)(({ database, body }) => {
  createEvents(database, body);
});

export const cancelConstructionEvent = createController(
  '/events/:eventId',
  'delete',
)(({ database, path: { eventId } }) => {
  database.transaction((db) => {
    const cancelledEvent = db.selectObject({
      sql: selectEventByIdQuery,
      bind: {
        $event_id: eventId,
      },
      schema: eventSchema,
    })! as GameEvent<'buildingLevelChange'>;

    const { level, buildingId, villageId, buildingFieldId, resolvesAt } =
      cancelledEvent;

    // Delete this event and all future events on the same building fields
    db.exec({
      sql: `
        DELETE
        FROM
          events
        WHERE
          village_id = $village_id
          AND JSON_EXTRACT(events.meta, '$.buildingFieldId') = $building_field_id
          AND resolves_at >= $resolves_at
        ;
      `,
      bind: {
        $village_id: villageId,
        $building_field_id: buildingFieldId,
        $resolves_at: resolvesAt,
      },
    });

    // Also cancel all higher levels of the same building from the new table
    db.exec({
      sql: `
        DELETE
        FROM
          scheduled_building_upgrades
        WHERE
          village_id = $village_id
          AND building_field_id = $building_field_id
          AND level >= $level
      `,
      bind: {
        $village_id: villageId,
        $building_field_id: buildingFieldId,
        $level: level,
      },
    });

    // If building was being created (level 1), we need to demolish it
    if (level === 1) {
      demolishBuilding(db, villageId, buildingFieldId);
    }

    // If event is already ongoing, refund resources
    if (cancelledEvent.type === 'buildingLevelChange') {
      const now = Date.now();
      const duration = cancelledEvent.resolvesAt - cancelledEvent.startsAt;
      const elapsed = Math.max(0, now - cancelledEvent.startsAt);
      const completionPercentage =
        duration > 0 ? Math.min(1, elapsed / duration) : 1;

      const resourcesToRefund = calculateBuildingCancellationRefundForLevel(
        buildingId,
        level,
        completionPercentage,
      );

      addVillageResourcesAt(db, villageId, now, resourcesToRefund);
    }
  });

  triggerKick();
});
