import { z } from 'zod';
import { getBuildingDefinition } from '@pillage-first/game-assets/utils/buildings';
import { buildingIdSchema } from '@pillage-first/types/models/building';
import { BuildingConstructionQueueFullError } from '@pillage-first/utils/errors';
import { selectRelevantActiveBuildingConstructionExistsQuery } from '../../queries/event-queries';
import {
  selectActiveAndScheduledBuildingConstructionCountQuery,
  selectBuildingFieldForScheduledUpgradeQuery,
  selectBuildingFieldPendingConstructionExistsQuery,
  selectScheduledBuildingUpgradeCancellationTargetQuery,
  selectScheduledBuildingVirtualLevelQuery,
  updateScheduledBuildingUpgradeQueuePositionQuery,
} from '../../queries/scheduled-building-upgrades-queries';
import {
  createBuildingPlaceholder,
  removeBuildingPlaceholder,
} from '../../utils/building-placeholder';
import {
  insertScheduledBuildingUpgrade,
  removeScheduledBuildingUpgradeChain,
  selectScheduledBuildingUpgrades,
} from '../../utils/scheduled-building-upgrades';
import { createController } from '../controller';
import {
  reorderScheduledBuildingUpgradesSchema,
  scheduleBuildingUpgradeSchema,
  scheduledBuildingUpgradeSchema,
} from './schemas/scheduled-building-upgrades-schemas';

export const getScheduledBuildingUpgrades = createController(
  '/villages/:villageId/scheduled-building-upgrades',
  {
    summary: 'Get scheduled building upgrades',
    requestParams: {
      path: z.strictObject({ villageId: z.coerce.number() }),
    },
    response: z.array(scheduledBuildingUpgradeSchema),
  },
)(({ database, path: { villageId } }) => {
  return selectScheduledBuildingUpgrades(database, villageId);
});

export const scheduleBuildingUpgrade = createController(
  '/villages/:villageId/scheduled-building-upgrades',
  'post',
  {
    summary: 'Schedule a building upgrade',
    requestParams: {
      path: z.strictObject({ villageId: z.coerce.number() }),
    },
    requestBody: scheduleBuildingUpgradeSchema,
  },
)(({ database, path: { villageId }, body }) => {
  database.transaction((db) => {
    const { buildingId, buildingFieldId, level } = body;

    const hasActiveRelevantConstruction = db.selectValue({
      sql: selectRelevantActiveBuildingConstructionExistsQuery,
      bind: {
        $village_id: villageId,
        $building_field_id: buildingFieldId,
      },
      schema: z.coerce.boolean(),
    })!;

    if (!hasActiveRelevantConstruction) {
      throw new Error(
        'Cannot schedule building upgrade without active construction',
      );
    }

    const activeAndScheduledCount = db.selectValue({
      sql: selectActiveAndScheduledBuildingConstructionCountQuery,
      bind: { $village_id: villageId },
      schema: z.number(),
    })!;

    if (activeAndScheduledCount >= 5) {
      throw new BuildingConstructionQueueFullError();
    }

    const { maxLevel } = getBuildingDefinition(buildingId);

    if (level > maxLevel) {
      throw new Error('Building level cannot exceed max level');
    }

    const currentVirtualLevel = db.selectValue({
      sql: selectScheduledBuildingVirtualLevelQuery,
      bind: {
        $village_id: villageId,
        $building_field_id: buildingFieldId,
        $building_id: buildingId,
      },
      schema: z.number().nullable(),
    });

    if (level !== (currentVirtualLevel ?? 0) + 1) {
      throw new Error('Scheduled building upgrades must be consecutive');
    }

    const existingBuilding = db.selectObject({
      sql: selectBuildingFieldForScheduledUpgradeQuery,
      bind: {
        $village_id: villageId,
        $building_field_id: buildingFieldId,
      },
      schema: z.strictObject({
        buildingId: buildingIdSchema,
        level: z.number(),
      }),
    });

    if (existingBuilding && existingBuilding.buildingId !== buildingId) {
      const hasPendingConstruction = db.selectValue({
        sql: selectBuildingFieldPendingConstructionExistsQuery,
        bind: {
          $village_id: villageId,
          $building_field_id: buildingFieldId,
        },
        schema: z.coerce.boolean(),
      })!;

      if (
        existingBuilding.level > 0 ||
        buildingFieldId <= 18 ||
        hasPendingConstruction
      ) {
        throw new Error('Building field is already occupied');
      }

      removeBuildingPlaceholder(
        db,
        villageId,
        buildingFieldId,
        existingBuilding.buildingId,
      );
    }

    const isNewBuilding =
      existingBuilding === undefined ||
      existingBuilding.buildingId !== buildingId;

    insertScheduledBuildingUpgrade(db, {
      buildingId,
      villageId,
      buildingFieldId,
      level,
    });

    if (isNewBuilding) {
      createBuildingPlaceholder(db, villageId, buildingFieldId, buildingId);
    }
  });
});

export const reorderScheduledBuildingUpgrades = createController(
  '/villages/:villageId/scheduled-building-upgrades',
  'patch',
  {
    summary: 'Reorder scheduled building upgrades',
    requestParams: {
      path: z.strictObject({ villageId: z.coerce.number() }),
    },
    requestBody: reorderScheduledBuildingUpgradesSchema,
  },
)(({ database, path: { villageId }, body: { scheduledUpgradeIds } }) => {
  database.transaction((db) => {
    const scheduledUpgrades = selectScheduledBuildingUpgrades(db, villageId);
    const upgradesById = new Map(
      scheduledUpgrades.map((upgrade) => [upgrade.id, upgrade]),
    );

    if (
      scheduledUpgradeIds.length !== scheduledUpgrades.length ||
      new Set(scheduledUpgradeIds).size !== scheduledUpgradeIds.length ||
      scheduledUpgradeIds.some((id) => !upgradesById.has(id))
    ) {
      throw new Error('Scheduled upgrade order must include the entire queue');
    }

    const lastLevelByFieldId = new Map<number, number>();
    for (const id of scheduledUpgradeIds) {
      const upgrade = upgradesById.get(id)!;
      const lastLevel = lastLevelByFieldId.get(upgrade.buildingFieldId);
      if (lastLevel !== undefined && upgrade.level <= lastLevel) {
        throw new Error(
          'Scheduled upgrades for the same building field cannot be reordered',
        );
      }
      lastLevelByFieldId.set(upgrade.buildingFieldId, upgrade.level);
    }

    for (const [queuePosition, id] of scheduledUpgradeIds.entries()) {
      db.exec({
        sql: updateScheduledBuildingUpgradeQueuePositionQuery,
        bind: {
          $queue_position: queuePosition,
          $id: id,
          $village_id: villageId,
        },
      });
    }
  });
});

export const cancelScheduledBuildingUpgrade = createController(
  '/villages/:villageId/scheduled-building-upgrades/:scheduledUpgradeId',
  'delete',
  {
    summary: 'Cancel a scheduled building upgrade',
    requestParams: {
      path: z.strictObject({
        villageId: z.coerce.number(),
        scheduledUpgradeId: z.coerce.number(),
      }),
    },
  },
)(({ database, path: { villageId, scheduledUpgradeId } }) => {
  database.transaction((db) => {
    const cancelled = db.selectObject({
      sql: selectScheduledBuildingUpgradeCancellationTargetQuery,
      bind: { $id: scheduledUpgradeId, $village_id: villageId },
      schema: z.strictObject({
        buildingId: buildingIdSchema,
        buildingFieldId: z.number(),
        level: z.number(),
      }),
    });

    if (!cancelled) {
      return;
    }

    removeScheduledBuildingUpgradeChain(db, {
      villageId,
      buildingId: cancelled.buildingId,
      buildingFieldId: cancelled.buildingFieldId,
      fromLevel: cancelled.level,
    });

    if (cancelled.level === 1) {
      removeBuildingPlaceholder(
        db,
        villageId,
        cancelled.buildingFieldId,
        cancelled.buildingId,
      );
    }
  });
});
