import { z } from 'zod';
import type { Building } from '@pillage-first/types/models/building';
import { buildingIdSchema } from '@pillage-first/types/models/building';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import type { Village } from '@pillage-first/types/models/village';
import { BuildingConstructionQueueFullError } from '@pillage-first/utils/errors';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { removeBuildingPlaceholder } from './building-placeholder';
import { assertBuildingConstructionRequirementsAreMet } from './building-requirements';
import { createEvents } from './create-event';

export const scheduledBuildingUpgradeRowSchema = z.strictObject({
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
    sql: `
      SELECT
        sbu.id,
        bi.building AS buildingId,
        sbu.village_id AS villageId,
        sbu.building_field_id AS buildingFieldId,
        sbu.level
      FROM scheduled_building_upgrades sbu
      JOIN building_ids bi ON bi.id = sbu.building_id
      WHERE sbu.village_id = $village_id
      ORDER BY sbu.queue_position, sbu.id;
    `,
    bind: { $village_id: villageId },
    schema: scheduledBuildingUpgradeRowSchema,
  });

const selectNextScheduledBuildingUpgrade = (
  database: DbFacade,
  villageId: Village['id'],
): ScheduledBuildingUpgradeRow | undefined =>
  database.selectObject({
    sql: `
      SELECT
        sbu.id,
        bi.building AS buildingId,
        sbu.village_id AS villageId,
        sbu.building_field_id AS buildingFieldId,
        sbu.level
      FROM scheduled_building_upgrades sbu
      JOIN building_ids bi ON bi.id = sbu.building_id
      WHERE sbu.village_id = $village_id
      ORDER BY sbu.queue_position, sbu.id
      LIMIT 1;
    `,
    bind: { $village_id: villageId },
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
    sql: `
      INSERT INTO scheduled_building_upgrades (
        building_id,
        village_id,
        building_field_id,
        level,
        queue_position
      )
      VALUES (
        (SELECT id FROM building_ids WHERE building = $building_id),
        $village_id,
        $building_field_id,
        $level,
        COALESCE(
          (
            SELECT MAX(queue_position) + 1
            FROM scheduled_building_upgrades
            WHERE village_id = $village_id
          ),
          0
        )
      );
    `,
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
    sql: `
      DELETE FROM scheduled_building_upgrades
      WHERE village_id = $village_id
        AND building_id = (
          SELECT id FROM building_ids WHERE building = $building_id
        )
        AND building_field_id = $building_field_id
        AND level >= $level;
    `,
    bind: {
      $village_id: villageId,
      $building_id: buildingId,
      $building_field_id: buildingFieldId,
      $level: fromLevel,
    },
  });
};

export const promoteNextScheduledBuildingUpgrade = (
  database: DbFacade,
  villageId: Village['id'],
  startsAt?: number,
): void => {
  while (true) {
    const scheduledUpgrade = selectNextScheduledBuildingUpgrade(
      database,
      villageId,
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
        sql: 'DELETE FROM scheduled_building_upgrades WHERE id = $id;',
        bind: { $id: scheduledUpgrade.id },
      });
      return;
    } catch (error) {
      if (error instanceof BuildingConstructionQueueFullError) {
        return;
      }

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
    }
  }
};
