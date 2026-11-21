import { z } from 'zod';
import {
  calculateBuildingCostForLevel,
  calculateBuildingDestructionDuration,
  calculateBuildingDurationForLevel,
  getBuildingDataForLevel,
  getBuildingDefinition,
} from '@pillage-first/game-assets/utils/buildings';
import {
  type Building,
  buildingIdSchema,
} from '@pillage-first/types/models/building';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { ResourceBundle } from '@pillage-first/types/models/resource';
import { speedSchema } from '@pillage-first/types/models/server';
import { tileIdSchema } from '@pillage-first/types/models/tile';
import { tribeSchema } from '@pillage-first/types/models/tribe';
import type { Village } from '@pillage-first/types/models/village';
import { BuildingConstructionQueueFullError } from '@pillage-first/utils/errors';
import type { DbFacade } from '@pillage-first/utils/facades/database';
import { assessBuildingRequirements } from '@pillage-first/utils/game/building-requirements';
import { calculateComputedEffect } from '@pillage-first/utils/game/calculate-computed-effect';
import type { EventCreationArgs } from '../http/events/resolver';
import {
  selectAllRelevantEffectsByIdQuery,
  updatePopulationEffectQuery,
} from '../queries/effect-queries';
import {
  selectTribeByVillageId,
  selectVillageBuildingLevelQuery,
  selectVillageTileIdQuery,
} from '../queries/village-queries';
import { demolishBuilding } from './village';
import { apiEffectsJsonSchema } from './zod/effect-schemas';

export const getVillageBuildingLevel = (
  database: DbFacade,
  villageId: number,
  buildingId: Building['id'],
): number =>
  database.selectValue({
    sql: selectVillageBuildingLevelQuery,
    bind: {
      $village_id: villageId,
      $building_id: buildingId,
    },
    schema: z.number().nullable(),
  }) ?? 0;

export const requireVillageBuildingLevel = (
  database: DbFacade,
  villageId: number,
  buildingId: Building['id'],
  errorMessage: string,
  minimumLevel = 1,
): number => {
  const level = getVillageBuildingLevel(database, villageId, buildingId);
  if (level < minimumLevel) {
    throw new Error(errorMessage);
  }
  return level;
};

export const validateDowngrade = (database: DbFacade, villageId: number) => {
  requireVillageBuildingLevel(
    database,
    villageId,
    'MAIN_BUILDING',
    'Main building level 10 is required to downgrade buildings',
    10,
  );

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

export const createBuildingPlaceholder = (
  database: DbFacade,
  villageId: Village['id'],
  buildingFieldId: BuildingField['id'],
  buildingId: Building['id'],
): void => {
  database.exec({
    sql: `
      INSERT INTO building_fields (
        village_id,
        field_id,
        building_id,
        level
      )
      SELECT
        $village_id,
        $field_id,
        bi.id,
        0
      FROM
        building_ids bi
      WHERE
        bi.building = $building_id;
    `,
    bind: {
      $village_id: villageId,
      $field_id: buildingFieldId,
      $building_id: buildingId,
    },
  });

  const tribe = database.selectValue({
    sql: selectTribeByVillageId,
    bind: { $village_id: villageId },
    schema: tribeSchema,
  })!;

  const effects = getBuildingDefinition(buildingId).effects(tribe);

  database.exec({
    sql: `
      INSERT INTO effects (
        effect_id,
        value,
        type_id,
        scope_id,
        source_id,
        tile_id,
        source_specifier
      )
      SELECT
        effect_ids.id,
        json_extract(effect.value, '$.value'),
        effect_type_ids.id,
        effect_scope_ids.id,
        effect_source_ids.id,
        (SELECT tile_id FROM villages WHERE id = $village_id),
        $source_specifier
      FROM
        json_each($effects) AS effect
        JOIN effect_ids
          ON effect_ids.effect = json_extract(effect.value, '$.effectId')
        JOIN effect_type_ids
          ON effect_type_ids.type = json_extract(effect.value, '$.type')
        JOIN effect_scope_ids
          ON effect_scope_ids.scope = 'local'
        JOIN effect_source_ids
          ON effect_source_ids.source = 'building';
    `,
    bind: {
      $effects: JSON.stringify(
        effects.map(({ effectId, valuesPerLevel, type }) => ({
          effectId,
          type,
          value: valuesPerLevel[0],
        })),
      ),
      $village_id: villageId,
      $source_specifier: buildingFieldId,
    },
  });

  const { population } = getBuildingDataForLevel(buildingId, 0);

  database.exec({
    sql: updatePopulationEffectQuery,
    bind: {
      $village_id: villageId,
      $value: population,
    },
  });
};

export const removeBuildingPlaceholder = (
  database: DbFacade,
  villageId: Village['id'],
  buildingFieldId: BuildingField['id'],
  buildingId: Building['id'],
): void => {
  if (buildingFieldId < 19 || buildingFieldId > 38) {
    return;
  }

  const hasMatchingPlaceholder = database.selectValue({
    sql: `
      SELECT EXISTS (
        SELECT 1
        FROM
          building_fields bf
          JOIN building_ids bi ON bi.id = bf.building_id
        WHERE
          bf.village_id = $village_id
          AND bf.field_id = $building_field_id
          AND bf.level = 0
          AND bi.building = $building_id
      );
    `,
    bind: {
      $village_id: villageId,
      $building_field_id: buildingFieldId,
      $building_id: buildingId,
    },
    schema: z.coerce.boolean(),
  })!;

  if (!hasMatchingPlaceholder) {
    return;
  }

  database.exec({
    sql: `
      DELETE FROM effects
      WHERE
        tile_id = (SELECT tile_id FROM villages WHERE id = $village_id)
        AND source_specifier = $building_field_id
        AND source_id = (
          SELECT id FROM effect_source_ids WHERE source = 'building'
        );
    `,
    bind: {
      $village_id: villageId,
      $building_field_id: buildingFieldId,
    },
  });

  const { population } = getBuildingDataForLevel(buildingId, 0);

  database.exec({
    sql: updatePopulationEffectQuery,
    bind: {
      $village_id: villageId,
      $value: -population,
    },
  });

  demolishBuilding(database, villageId, buildingFieldId);
};

const buildingLevelRowSchema = z.strictObject({
  buildingId: buildingIdSchema,
  level: z.number(),
});

export const assessBuildingConstructionRequirements = (
  database: DbFacade,
  villageId: Village['id'],
  buildingId: Building['id'],
  options: {
    buildingFieldId?: number;
    excludedScheduledBuildingUpgradeId?: number;
  } = {},
): ReturnType<typeof assessBuildingRequirements> => {
  const tribe = database.selectValue({
    sql: selectTribeByVillageId,
    bind: { $village_id: villageId },
    schema: tribeSchema,
  })!;

  const buildingLevels = database.selectObjects({
    sql: `
      SELECT
        bi.building AS buildingId,
        MAX(bf.level) AS level
      FROM
        building_fields bf
        JOIN building_ids bi ON bi.id = bf.building_id
      WHERE
        bf.village_id = $village_id
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
      SELECT buildingId
      FROM (
        SELECT JSON_EXTRACT(e.meta, '$.buildingId') AS buildingId
        FROM
          events e
        WHERE
          e.village_id = $village_id
          AND e.type IN ('buildingConstruction', 'buildingLevelChange')
          AND CAST(JSON_EXTRACT(e.meta, '$.previousLevel') AS INTEGER) = 0
          AND CAST(JSON_EXTRACT(e.meta, '$.level') AS INTEGER) > 0

        UNION

        SELECT bi.building AS buildingId
        FROM
          scheduled_building_upgrades sbu
          JOIN building_ids bi ON bi.id = sbu.building_id
        WHERE
          sbu.village_id = $village_id
          AND sbu.level = 1
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

  return assessBuildingRequirements({
    building: getBuildingDefinition(buildingId),
    tribe,
    maxLevelByBuildingId: new Map(
      buildingLevels.map(({ buildingId, level }) => [buildingId, level]),
    ),
    buildingIdsInQueue: new Set(queuedBuildingIds),
  });
};

export const assertBuildingConstructionRequirementsAreMet = (
  database: DbFacade,
  villageId: Village['id'],
  buildingId: Building['id'],
  options: {
    buildingFieldId?: number;
    excludedScheduledBuildingUpgradeId?: number;
  } = {},
): void => {
  const { canBuild } = assessBuildingConstructionRequirements(
    database,
    villageId,
    buildingId,
    options,
  );

  if (!canBuild) {
    throw new Error('Building requirements are not met');
  }
};

export const getBuildingLevelChangeCost = (
  database: DbFacade,
  event: Pick<
    GameEvent<'buildingLevelChange'>,
    'buildingId' | 'level' | 'previousLevel'
  >,
): ResourceBundle => {
  if (event.previousLevel > event.level) {
    return [0, 0, 0, 0];
  }

  const isFreeBuildingConstructionEnabled = database.selectValue({
    sql: 'SELECT is_free_building_construction_enabled FROM developer_settings',
    schema: z.coerce.boolean(),
  });

  if (isFreeBuildingConstructionEnabled) {
    return [0, 0, 0, 0];
  }

  const { buildingId, level } = event;
  return calculateBuildingCostForLevel(buildingId, level);
};
