import { z } from 'zod';
import { getBuildingDefinition } from '@pillage-first/game-assets/utils/buildings';
import {
  type Building,
  buildingIdSchema,
} from '@pillage-first/types/models/building';
import { tribeSchema } from '@pillage-first/types/models/tribe';
import type { Village } from '@pillage-first/types/models/village';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { assessBuildingRequirements } from '@pillage-first/utils/game/building-requirements';
import { selectTribeByVillageId } from '../queries/village-queries';

const buildingLevelRowSchema = z.strictObject({
  buildingId: buildingIdSchema,
  level: z.number(),
});

export const assertBuildingConstructionRequirementsAreMet = (
  database: DbFacade,
  villageId: Village['id'],
  buildingId: Building['id'],
  options: {
    buildingFieldId?: number;
    excludedScheduledBuildingUpgradeId?: number;
  } = {},
): void => {
  const tribe = database.selectValue({
    sql: selectTribeByVillageId,
    bind: { $village_id: villageId },
    schema: tribeSchema,
  })!;

  const buildingLevels = database.selectObjects({
    sql: `
      SELECT bi.building AS buildingId, MAX(bf.level) AS level
      FROM building_fields bf
      JOIN building_ids bi ON bi.id = bf.building_id
      WHERE bf.village_id = $village_id
        AND NOT (
          bf.field_id = $building_field_id
          AND bf.level = 0
        )
      GROUP BY bi.building;
    `,
    bind: {
      $village_id: villageId,
      $building_field_id: options.buildingFieldId ?? null,
    },
    schema: buildingLevelRowSchema,
  });

  const queuedBuildingIds = database.selectValues({
    sql: `
      SELECT DISTINCT buildingId
      FROM (
        SELECT JSON_EXTRACT(e.meta, '$.buildingId') AS buildingId
        FROM events e
        WHERE e.village_id = $village_id
          AND (
            e.type = 'buildingConstruction'
            OR e.type = 'buildingScheduledConstruction'
            OR (
              e.type = 'buildingLevelChange'
              AND CAST(JSON_EXTRACT(e.meta, '$.level') AS INTEGER) >
                  CAST(JSON_EXTRACT(e.meta, '$.previousLevel') AS INTEGER)
            )
          )

        UNION

        SELECT bi.building AS buildingId
        FROM scheduled_building_upgrades sbu
        JOIN building_ids bi ON bi.id = sbu.building_id
        WHERE sbu.village_id = $village_id
          AND sbu.id IS NOT $excluded_scheduled_building_upgrade_id
      );
    `,
    bind: {
      $village_id: villageId,
      $excluded_scheduled_building_upgrade_id:
        options.excludedScheduledBuildingUpgradeId ?? null,
    },
    schema: buildingIdSchema,
  });

  const { canBuild } = assessBuildingRequirements({
    building: getBuildingDefinition(buildingId),
    tribe,
    maxLevelByBuildingId: new Map(
      buildingLevels.map(({ buildingId, level }) => [buildingId, level]),
    ),
    buildingIdsInQueue: new Set(queuedBuildingIds),
  });

  if (!canBuild) {
    throw new Error('Building requirements are not met');
  }
};
