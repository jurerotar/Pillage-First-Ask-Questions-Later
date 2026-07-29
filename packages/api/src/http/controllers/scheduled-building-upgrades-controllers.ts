import { z } from 'zod';
import { getBuildingDefinition } from '@pillage-first/game-assets/utils/buildings';
import { buildingIdSchema } from '@pillage-first/types/models/building';
import { BuildingConstructionQueueFullError } from '@pillage-first/utils/errors';
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
  const numericVillageId = Number(villageId);

  database.transaction((db) => {
    const activeAndScheduledCount = db.selectValue({
      sql: `
        SELECT
          (
            SELECT COUNT(*)
            FROM events
            WHERE village_id = $village_id
              AND (
                type = 'buildingConstruction'
                OR (
                  type = 'buildingLevelChange'
                  AND CAST(JSON_EXTRACT(meta, '$.level') AS INTEGER) >
                      CAST(JSON_EXTRACT(meta, '$.previousLevel') AS INTEGER)
                )
              )
          )
          +
          (
            SELECT COUNT(*)
            FROM scheduled_building_upgrades
            WHERE village_id = $village_id
          );
      `,
      bind: { $village_id: numericVillageId },
      schema: z.number(),
    })!;

    if (activeAndScheduledCount >= 5) {
      throw new BuildingConstructionQueueFullError();
    }

    const { buildingId, buildingFieldId, level } = body;
    const { maxLevel } = getBuildingDefinition(buildingId);

    if (level > maxLevel) {
      throw new Error('Building level cannot exceed max level');
    }

    const currentVirtualLevel = db.selectValue({
      sql: `
        SELECT MAX(level)
        FROM (
          SELECT bf.level
          FROM building_fields bf
          JOIN building_ids bi ON bi.id = bf.building_id
          WHERE bf.village_id = $village_id
            AND bf.field_id = $building_field_id
            AND bi.building = $building_id

          UNION ALL

          SELECT CAST(JSON_EXTRACT(meta, '$.level') AS INTEGER)
          FROM events
          WHERE village_id = $village_id
            AND type IN ('buildingConstruction', 'buildingLevelChange')
            AND CAST(JSON_EXTRACT(meta, '$.buildingFieldId') AS INTEGER) =
                $building_field_id

          UNION ALL

          SELECT level
          FROM scheduled_building_upgrades
          WHERE village_id = $village_id
            AND building_field_id = $building_field_id
        );
      `,
      bind: {
        $village_id: numericVillageId,
        $building_field_id: buildingFieldId,
        $building_id: buildingId,
      },
      schema: z.number().nullable(),
    });

    if (level !== (currentVirtualLevel ?? 0) + 1) {
      throw new Error('Scheduled building upgrades must be consecutive');
    }

    const existingBuilding = db.selectObject({
      sql: `
        SELECT bi.building AS buildingId, bf.level
        FROM building_fields bf
        JOIN building_ids bi ON bi.id = bf.building_id
        WHERE bf.village_id = $village_id
          AND bf.field_id = $building_field_id;
      `,
      bind: {
        $village_id: numericVillageId,
        $building_field_id: buildingFieldId,
      },
      schema: z.strictObject({
        buildingId: buildingIdSchema,
        level: z.number(),
      }),
    });

    if (existingBuilding && existingBuilding.buildingId !== buildingId) {
      const hasPendingConstruction = db.selectValue({
        sql: `
          SELECT EXISTS (
            SELECT 1
            FROM events
            WHERE village_id = $village_id
              AND type IN ('buildingConstruction', 'buildingLevelChange')
              AND CAST(JSON_EXTRACT(meta, '$.buildingFieldId') AS INTEGER) =
                  $building_field_id

            UNION ALL

            SELECT 1
            FROM scheduled_building_upgrades
            WHERE village_id = $village_id
              AND building_field_id = $building_field_id
          );
        `,
        bind: {
          $village_id: numericVillageId,
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
        numericVillageId,
        buildingFieldId,
        existingBuilding.buildingId,
      );
    }

    const isNewBuilding =
      existingBuilding === undefined ||
      existingBuilding.buildingId !== buildingId;

    insertScheduledBuildingUpgrade(db, {
      buildingId,
      villageId: numericVillageId,
      buildingFieldId,
      level,
    });

    if (isNewBuilding) {
      createBuildingPlaceholder(
        db,
        numericVillageId,
        buildingFieldId,
        buildingId,
      );
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
  const numericVillageId = Number(villageId);

  database.transaction((db) => {
    const scheduledUpgrades = selectScheduledBuildingUpgrades(
      db,
      numericVillageId,
    );
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
        sql: `
          UPDATE scheduled_building_upgrades
          SET queue_position = $queue_position
          WHERE id = $id AND village_id = $village_id;
        `,
        bind: {
          $queue_position: queuePosition,
          $id: id,
          $village_id: numericVillageId,
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
  const numericVillageId = Number(villageId);

  database.transaction((db) => {
    const cancelled = db.selectObject({
      sql: `
        SELECT
          bi.building AS buildingId,
          sbu.building_field_id AS buildingFieldId,
          sbu.level
        FROM scheduled_building_upgrades sbu
        JOIN building_ids bi ON bi.id = sbu.building_id
        WHERE sbu.id = $id AND sbu.village_id = $village_id;
      `,
      bind: { $id: scheduledUpgradeId, $village_id: numericVillageId },
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
      villageId: numericVillageId,
      buildingId: cancelled.buildingId,
      buildingFieldId: cancelled.buildingFieldId,
      fromLevel: cancelled.level,
    });

    if (cancelled.level === 1) {
      removeBuildingPlaceholder(
        db,
        numericVillageId,
        cancelled.buildingFieldId,
        cancelled.buildingId,
      );
    }
  });
});
