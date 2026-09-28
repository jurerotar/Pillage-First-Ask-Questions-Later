import { z } from 'zod';
import type {
  ScheduledBuildingConstructionCancellationReason,
  ScheduledBuildingConstructionCancelledNotificationEvent,
} from '@pillage-first/types/api-events';
import type { Building } from '@pillage-first/types/models/building';
import { buildingIdSchema } from '@pillage-first/types/models/building';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import type {
  ScheduledConstructionCancellationReasonDetail,
  ScheduledConstructionCancellationReport,
} from '@pillage-first/types/models/report';
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
import {
  assertBuildingConstructionRequirementsAreMet,
  assessBuildingConstructionRequirements,
} from './building-requirements';
import { createEvents } from './create-event';
import { getEventCost } from './events';
import { insertScheduledConstructionCancellationReport } from './report';
import { calculateResourceSiteResourcesAt, getVillageTileId } from './village';

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
  reasonDetail: ScheduledConstructionCancellationReasonDetail,
): void => {
  postWorkerMessage({
    eventKey: 'scheduled-building-construction:cancelled',
    villageId: scheduledUpgrade.villageId,
    buildingId: scheduledUpgrade.buildingId,
    buildingFieldId: scheduledUpgrade.buildingFieldId,
    level: scheduledUpgrade.level,
    reason,
    reasonDetail,
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

const getMissingResourcesCancellationDetail = (
  database: DbFacade,
  scheduledUpgrade: ScheduledBuildingUpgradeRow,
  timestamp: number,
): Extract<
  ScheduledConstructionCancellationReasonDetail,
  { type: 'missing-resources' }
> => {
  const [woodCost, clayCost, ironCost, wheatCost] = getEventCost(database, {
    type: 'buildingLevelChange',
    villageId: scheduledUpgrade.villageId,
    buildingId: scheduledUpgrade.buildingId,
    buildingFieldId: scheduledUpgrade.buildingFieldId,
    previousLevel: scheduledUpgrade.level - 1,
    level: scheduledUpgrade.level,
    startsAt: timestamp,
  } as unknown as Parameters<typeof getEventCost>[1]);

  const { currentWood, currentClay, currentIron, currentWheat } =
    calculateResourceSiteResourcesAt(
      database,
      getVillageTileId(database, scheduledUpgrade.villageId),
      timestamp,
    );

  return {
    type: 'missing-resources',
    missingResources: [
      Math.max(0, woodCost - currentWood),
      Math.max(0, clayCost - currentClay),
      Math.max(0, ironCost - currentIron),
      Math.max(0, wheatCost - currentWheat),
    ],
  };
};

const getMissingRequirementsCancellationDetail = (
  database: DbFacade,
  scheduledUpgrade: ScheduledBuildingUpgradeRow,
): Extract<
  ScheduledConstructionCancellationReasonDetail,
  { type: 'missing-requirements' }
> => {
  const currentLevels = database.selectObjects({
    sql: `
      SELECT bi.building AS buildingId, MAX(bf.level) AS level
      FROM building_fields bf
      JOIN building_ids bi ON bi.id = bf.building_id
      WHERE bf.village_id = $village_id
      GROUP BY bi.building;
    `,
    bind: { $village_id: scheduledUpgrade.villageId },
    schema: z.strictObject({
      buildingId: buildingIdSchema,
      level: z.number(),
    }),
  });

  const currentLevelByBuildingId = new Map(
    currentLevels.map(({ buildingId, level }) => [buildingId, level]),
  );

  const { assessedRequirements } = assessBuildingConstructionRequirements(
    database,
    scheduledUpgrade.villageId,
    scheduledUpgrade.buildingId,
    {
      buildingFieldId: scheduledUpgrade.buildingFieldId,
      excludedScheduledBuildingUpgradeId: scheduledUpgrade.id,
    },
  );

  const unmetRequirements: Extract<
    ScheduledConstructionCancellationReasonDetail,
    { type: 'missing-requirements' }
  >['unmetRequirements'] = [];

  for (const requirement of assessedRequirements) {
    if (requirement.fulfilled) {
      continue;
    }

    if (requirement.type === 'building') {
      unmetRequirements.push({
        type: 'building',
        buildingId: requirement.buildingId,
        requiredLevel: requirement.level,
        currentLevel:
          currentLevelByBuildingId.get(requirement.buildingId) ?? null,
      });
      continue;
    }

    if (requirement.type === 'tribe') {
      unmetRequirements.push({
        type: 'tribe',
        tribe: requirement.tribe,
      });
      continue;
    }

    unmetRequirements.push({
      type: 'amount',
      amount: requirement.amount,
    });
  }

  return {
    type: 'missing-requirements',
    unmetRequirements,
  };
};

const getScheduledConstructionCancellationReasonDetail = (
  database: DbFacade,
  scheduledUpgrade: ScheduledBuildingUpgradeRow,
  reason: ScheduledBuildingConstructionCancellationReason,
  timestamp: number,
): ScheduledConstructionCancellationReport['reasonDetail'] => {
  if (reason === 'missing-resources') {
    return getMissingResourcesCancellationDetail(
      database,
      scheduledUpgrade,
      timestamp,
    );
  }

  return getMissingRequirementsCancellationDetail(database, scheduledUpgrade);
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
        const timestamp = startsAt ?? Date.now();
        const reasonDetail = getScheduledConstructionCancellationReasonDetail(
          database,
          scheduledUpgrade,
          cancellationReason,
          timestamp,
        );

        insertScheduledConstructionCancellationHistory(
          database,
          scheduledUpgrade,
        );
        insertScheduledConstructionCancellationReport(database, {
          villageId: scheduledUpgrade.villageId,
          timestamp,
          buildingId: scheduledUpgrade.buildingId,
          buildingFieldId: scheduledUpgrade.buildingFieldId,
          level: scheduledUpgrade.level,
          reason: cancellationReason,
          reasonDetail,
        });
        postScheduledConstructionCancelledNotification(
          scheduledUpgrade,
          cancellationReason,
          reasonDetail,
        );
      }
    }
  }
};
