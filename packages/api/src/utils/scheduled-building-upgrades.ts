import { z } from 'zod';
import type {
  ScheduledBuildingConstructionCancellationReason,
  ScheduledBuildingConstructionCancelledNotificationEvent,
} from '@pillage-first/types/api-events';
import type { Building } from '@pillage-first/types/models/building';
import { buildingIdSchema } from '@pillage-first/types/models/building';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import type { Village } from '@pillage-first/types/models/village';
import { BuildingConstructionQueueFullError } from '@pillage-first/utils/errors';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import {
  deleteScheduledBuildingUpgradeByIdQuery,
  deleteScheduledBuildingUpgradeChainQuery,
  insertScheduledBuildingUpgradeQuery,
  insertScheduledConstructionCancellationHistoryQuery,
  selectNextScheduledBuildingUpgradeQuery,
  selectScheduledBuildingUpgradesQuery,
} from '../queries/scheduled-building-upgrades-queries';
import { postWorkerMessage } from '../worker/notification-port';
import { removeBuildingPlaceholder } from './building-placeholder';
import { assertBuildingConstructionRequirementsAreMet } from './building-requirements';
import { createEvents } from './create-event';

const scheduledBuildingUpgradeRowSchema = z.strictObject({
  id: z.number(),
  buildingId: buildingIdSchema,
  villageId: z.number(),
  buildingFieldId: z.number(),
  level: z.number(),
});

export type ScheduledBuildingUpgradeRow = z.infer<
  typeof scheduledBuildingUpgradeRowSchema
>;

export const selectScheduledBuildingUpgrades = (
  database: DbFacade,
  villageId: Village['id'],
): ScheduledBuildingUpgradeRow[] =>
  database.selectObjects({
    sql: selectScheduledBuildingUpgradesQuery,
    bind: { $village_id: villageId },
    schema: scheduledBuildingUpgradeRowSchema,
  });

const selectNextScheduledBuildingUpgrade = (
  database: DbFacade,
  villageId: Village['id'],
  buildingFieldId?: BuildingField['id'],
): ScheduledBuildingUpgradeRow | undefined =>
  database.selectObject({
    sql: selectNextScheduledBuildingUpgradeQuery,
    bind: {
      $village_id: villageId,
      $building_field_id: buildingFieldId ?? null,
    },
    schema: scheduledBuildingUpgradeRowSchema,
  });

export const insertScheduledBuildingUpgrade = (
  database: DbFacade,
  args: {
    villageId: Village['id'];
    buildingId: Building['id'];
    buildingFieldId: BuildingField['id'];
    level: number;
  },
): void => {
  database.exec({
    sql: insertScheduledBuildingUpgradeQuery,
    bind: {
      $building_id: args.buildingId,
      $village_id: args.villageId,
      $building_field_id: args.buildingFieldId,
      $level: args.level,
    },
  });
};

export const removeScheduledBuildingUpgradeChain = (
  database: DbFacade,
  {
    villageId,
    buildingId,
    buildingFieldId,
    fromLevel,
  }: {
    villageId: Village['id'];
    buildingId: Building['id'];
    buildingFieldId: BuildingField['id'];
    fromLevel: number;
  },
): void => {
  database.exec({
    sql: deleteScheduledBuildingUpgradeChainQuery,
    bind: {
      $village_id: villageId,
      $building_id: buildingId,
      $building_field_id: buildingFieldId,
      $level: fromLevel,
    },
  });
};

const getScheduledConstructionCancellationReason = (
  error: unknown,
): ScheduledBuildingConstructionCancellationReason | undefined => {
  if (!(error instanceof Error)) {
    return;
  }

  if (error.message === 'Not enough resources') {
    return 'missing-resources';
  }

  if (error.message === 'Building requirements are not met') {
    return 'missing-requirements';
  }

  return;
};

const postScheduledConstructionCancelledNotification = (
  scheduledUpgrade: ScheduledBuildingUpgradeRow,
  reason: ScheduledBuildingConstructionCancellationReason,
): void => {
  postWorkerMessage({
    eventKey: 'scheduled-building-construction:cancelled',
    villageId: scheduledUpgrade.villageId,
    buildingId: scheduledUpgrade.buildingId,
    buildingFieldId: scheduledUpgrade.buildingFieldId,
    level: scheduledUpgrade.level,
    reason,
  } satisfies ScheduledBuildingConstructionCancelledNotificationEvent);
};

const insertScheduledConstructionCancellationHistory = (
  database: DbFacade,
  scheduledUpgrade: ScheduledBuildingUpgradeRow,
): void => {
  database.exec({
    sql: insertScheduledConstructionCancellationHistoryQuery,
    bind: {
      $village_id: scheduledUpgrade.villageId,
      $field_id: scheduledUpgrade.buildingFieldId,
      $building_id: scheduledUpgrade.buildingId,
      $level: scheduledUpgrade.level,
    },
  });
};

export const promoteNextScheduledBuildingUpgrade = (
  database: DbFacade,
  villageId: Village['id'],
  startsAt?: number,
  buildingFieldId?: BuildingField['id'],
): void => {
  while (true) {
    const scheduledUpgrade = selectNextScheduledBuildingUpgrade(
      database,
      villageId,
      buildingFieldId,
    );

    if (!scheduledUpgrade) {
      return;
    }

    try {
      if (scheduledUpgrade.level === 1) {
        assertBuildingConstructionRequirementsAreMet(
          database,
          villageId,
          scheduledUpgrade.buildingId,
          {
            buildingFieldId: scheduledUpgrade.buildingFieldId,
            excludedScheduledBuildingUpgradeId: scheduledUpgrade.id,
          },
        );
      }

      createEvents<'buildingLevelChange'>(database, {
        type: 'buildingLevelChange',
        villageId,
        buildingId: scheduledUpgrade.buildingId,
        buildingFieldId: scheduledUpgrade.buildingFieldId,
        previousLevel: scheduledUpgrade.level - 1,
        level: scheduledUpgrade.level,
        startsAt,
      });

      database.exec({
        sql: deleteScheduledBuildingUpgradeByIdQuery,
        bind: { $id: scheduledUpgrade.id },
      });
      return;
    } catch (error) {
      if (error instanceof BuildingConstructionQueueFullError) {
        return;
      }

      const cancellationReason =
        getScheduledConstructionCancellationReason(error);

      removeScheduledBuildingUpgradeChain(database, {
        villageId,
        buildingId: scheduledUpgrade.buildingId,
        buildingFieldId: scheduledUpgrade.buildingFieldId,
        fromLevel: scheduledUpgrade.level,
      });

      if (scheduledUpgrade.level === 1) {
        removeBuildingPlaceholder(
          database,
          villageId,
          scheduledUpgrade.buildingFieldId,
          scheduledUpgrade.buildingId,
        );
      }

      if (cancellationReason) {
        insertScheduledConstructionCancellationHistory(
          database,
          scheduledUpgrade,
        );
        postScheduledConstructionCancelledNotification(
          scheduledUpgrade,
          cancellationReason,
        );
      }
    }
  }
};
