import { z } from 'zod';
import {
  calculateBuildingDestructionDuration,
  calculateBuildingDurationForLevel,
} from '@pillage-first/game-assets/utils/buildings';
import { speedSchema } from '@pillage-first/types/models/server';
import { tileIdSchema } from '@pillage-first/types/models/tile';
import { BuildingConstructionQueueFullError } from '@pillage-first/utils/errors';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { calculateComputedEffect } from '@pillage-first/utils/game/calculate-computed-effect';
import { selectAllRelevantEffectsByIdQuery } from '../../../queries/effect-queries';
import {
  selectVillageBuildingLevelQuery,
  selectVillageTileIdQuery,
} from '../../../queries/village-queries';
import { apiEffectsJsonSchema } from '../../../utils/zod/effect-schemas';
import type { EventCreationArgs } from '../resolver';

export const validateDowngrade = (database: DbFacade, villageId: number) => {
  const mainBuildingLevel = database.selectValue({
    sql: selectVillageBuildingLevelQuery,
    bind: {
      $village_id: villageId,
      $building_id: 'MAIN_BUILDING',
    },
    schema: z.number().nullable(),
  })!;

  if (mainBuildingLevel === null || mainBuildingLevel < 10) {
    throw new Error(
      'Main building level 10 is required to downgrade buildings',
    );
  }

  const hasOngoingDowngradeEvent = database.selectValue({
    sql: `
      SELECT EXISTS (
        SELECT 1
        FROM
          events e
        WHERE
          e.village_id = $village_id
          AND e.type IN ('buildingLevelChange', 'buildingDestruction')
          AND CAST(JSON_EXTRACT(e.meta, '$.previousLevel') AS INTEGER) >
              CAST(JSON_EXTRACT(e.meta, '$.level') AS INTEGER)
      ) AS event_exists;
    `,
    bind: {
      $village_id: villageId,
    },
    schema: z.coerce.boolean(),
  });

  if (hasOngoingDowngradeEvent) {
    throw new Error('Main building is busy');
  }
};

export const validateBuildingQueue = (
  database: DbFacade,
  villageId: number,
  buildingFieldId: number,
) => {
  const hasOngoingBuildingEvent = database.selectValue({
    sql: `
      SELECT EXISTS (
        SELECT 1
        FROM
          events e
          JOIN villages v ON v.id = e.village_id
          JOIN players p ON p.id = v.player_id
          JOIN tribe_ids ti ON ti.id = p.tribe_id
        WHERE
          e.village_id = $village_id
          AND e.type IN ('buildingConstruction', 'buildingLevelChange')
          AND NOT (
            e.type = 'buildingLevelChange'
            AND CAST(JSON_EXTRACT(e.meta, '$.previousLevel') AS INTEGER) >
                CAST(JSON_EXTRACT(e.meta, '$.level') AS INTEGER)
          )
          AND (
            ti.tribe <> 'romans'
            OR (
              CAST(JSON_EXTRACT(e.meta, '$.buildingFieldId') AS INTEGER) <= 18
              AND CAST($building_field_id AS INTEGER) <= 18
            )
            OR (
              CAST(JSON_EXTRACT(e.meta, '$.buildingFieldId') AS INTEGER) > 18
              AND CAST($building_field_id AS INTEGER) > 18
            )
          )
      );
    `,
    bind: {
      $village_id: villageId,
      $building_field_id: buildingFieldId,
    },
    schema: z.coerce.boolean(),
  })!;

  if (hasOngoingBuildingEvent) {
    throw new BuildingConstructionQueueFullError();
  }
};

export const getBuildingChangeDuration = (
  database: DbFacade,
  event: EventCreationArgs<'buildingLevelChange' | 'buildingDestruction'>,
  isDowngrade: boolean,
) => {
  const isInstantBuildingConstructionEnabled = database.selectValue({
    sql: 'SELECT is_instant_building_construction_enabled FROM developer_settings',
    schema: z.coerce.boolean(),
  });

  if (isInstantBuildingConstructionEnabled) {
    return 0;
  }

  if (isDowngrade) {
    const speed = database.selectValue({
      sql: 'SELECT speed FROM servers LIMIT 1;',
      schema: speedSchema,
    })!;

    return calculateBuildingDestructionDuration(
      event.previousLevel - event.level,
      speed,
    );
  }

  const { villageId, buildingId, level } = event;

  const effects = database.selectValue({
    sql: selectAllRelevantEffectsByIdQuery,
    bind: {
      $effect_id: 'buildingDuration',
      $village_id: villageId,
    },
    schema: apiEffectsJsonSchema,
  })!;
  const tileId = database.selectValue({
    sql: selectVillageTileIdQuery,
    bind: {
      $village_id: villageId,
    },
    schema: tileIdSchema,
  })!;

  const { total } = calculateComputedEffect(
    'buildingDuration',
    effects,
    tileId,
  );

  const baseBuildingDuration = calculateBuildingDurationForLevel(
    buildingId,
    level,
  );

  return baseBuildingDuration * total;
};
