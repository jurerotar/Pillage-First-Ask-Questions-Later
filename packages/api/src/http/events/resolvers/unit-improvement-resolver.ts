import { z } from 'zod';
import {
  calculateUnitUpgradeCostForLevel,
  calculateUnitUpgradeDurationForLevel,
} from '@pillage-first/game-assets/utils/units';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { tileIdSchema } from '@pillage-first/types/models/tile';
import { calculateComputedEffect } from '@pillage-first/utils/game/calculate-computed-effect';
import { selectAllRelevantEffectsByIdQuery } from '../../../queries/effect-queries';
import { selectVillageEventExistsByTypeQuery } from '../../../queries/event-queries';
import { selectVillageTileIdQuery } from '../../../queries/village-queries';
import { requireVillageBuildingLevel } from '../../../utils/buildings';
import { insertUnitImprovementReport } from '../../../utils/report';
import { apiEffectsJsonSchema } from '../../../utils/zod/effect-schemas';
import { defineEventResolver, type Resolver } from '../resolver';

const resolveUnitImprovement: Resolver<GameEvent<'unitImprovement'>> = (
  database,
  args,
) => {
  const { villageId, unitId, level, resolvesAt } = args;

  database.exec({
    sql: `
      UPDATE unit_improvements
      SET
        level = $level
      WHERE
        player_id = (SELECT player_id FROM villages WHERE id = $village_id)
        AND unit_id = (
          SELECT id
          FROM unit_ids
          WHERE unit = $unit_id
          );
    `,
    bind: {
      $unit_id: unitId,
      $level: level,
      $village_id: villageId,
    },
  });

  const playerVillageIds = database.selectValues({
    sql: 'SELECT id FROM villages WHERE player_id = (SELECT player_id FROM villages WHERE id = $village_id);',
    bind: { $village_id: villageId },
    schema: z.number(),
  });

  insertUnitImprovementReport(database, {
    villageId,
    timestamp: resolvesAt,
    unitId,
    level,
  });

  return {
    affectedVillageIds: playerVillageIds,
    affectedTileIds: [],
  };
};

export const unitImprovementResolver = defineEventResolver<'unitImprovement'>(
  (database, event) => ({
    validate: () => {
      const { villageId, level } = event;

      requireVillageBuildingLevel(
        database,
        villageId,
        'SMITHY',
        'Smithy level is too low for this unit upgrade',
        level,
      );

      const hasOngoingUnitImprovementEventsInThisVillage = database.selectValue(
        {
          sql: selectVillageEventExistsByTypeQuery,
          bind: {
            $village_id: villageId,
            $type: 'unitImprovement',
          },
          schema: z.coerce.boolean(),
        },
      );

      if (hasOngoingUnitImprovementEventsInThisVillage) {
        throw new Error('Smithy is busy');
      }

      const currentUnitUpgradeLevel = database.selectValue({
        sql: `
          SELECT
            COALESCE(
              (
                SELECT
                  level
                FROM
                  unit_improvements
                WHERE
                  player_id = (
                    SELECT
                      player_id
                    FROM
                      villages
                    WHERE
                      id = $village_id
                  )
                  AND unit_id = (
                    SELECT
                      id
                    FROM
                      unit_ids
                    WHERE
                      unit = $unit_id
                  )
              ),
              0
            ) AS current_level;
        `,
        bind: {
          $village_id: villageId,
          $unit_id: event.unitId,
        },
        schema: z.number(),
      })!;

      if (currentUnitUpgradeLevel >= level) {
        throw new Error('Unit upgrade level already exists');
      }
    },
    cost: () => {
      const isFreeUnitImprovementEnabled = database.selectValue({
        sql: 'SELECT is_free_unit_improvement_enabled FROM developer_settings',
        schema: z.coerce.boolean(),
      });

      if (isFreeUnitImprovementEnabled) {
        return [0, 0, 0, 0];
      }

      const { unitId, level } = event;
      return calculateUnitUpgradeCostForLevel(unitId, level);
    },
    duration: () => {
      const isInstantUnitImprovementEnabled = database.selectValue({
        sql: 'SELECT is_instant_unit_improvement_enabled FROM developer_settings',
        schema: z.coerce.boolean(),
      });

      if (isInstantUnitImprovementEnabled) {
        return 0;
      }

      const { villageId, unitId, level } = event;

      const effects = database.selectValue({
        sql: selectAllRelevantEffectsByIdQuery,
        bind: {
          $effect_id: 'unitImprovementDuration',
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

      const { total: unitImprovementDurationModifier } =
        calculateComputedEffect('unitImprovementDuration', effects, tileId);

      return (
        unitImprovementDurationModifier *
        calculateUnitUpgradeDurationForLevel(unitId, level)
      );
    },
    startTime: () => {
      const { unitId } = event;

      const now = Date.now();

      const lastResolvesAtForThisUnitId = database.selectValue({
        sql: `
          SELECT COALESCE(MAX(resolves_at), $now)
          FROM
            events
          WHERE
            type = 'unitImprovement'
            AND JSON_EXTRACT(meta, '$.unitId') = $unit_id
        `,
        bind: {
          $unit_id: unitId,
          $now: now,
        },
        schema: z.number(),
      })!;

      return lastResolvesAtForThisUnitId;
    },
  }),
  resolveUnitImprovement,
);
