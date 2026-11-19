import { z } from 'zod';
import {
  calculateUnitResearchCost,
  calculateUnitResearchDuration,
  getUnitDefinition,
} from '@pillage-first/game-assets/utils/units';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { tileIdSchema } from '@pillage-first/types/models/tile';
import { calculateComputedEffect } from '@pillage-first/utils/game/calculate-computed-effect';
import { selectAllRelevantEffectsByIdQuery } from '../../../queries/effect-queries';
import { selectVillageEventExistsByTypeQuery } from '../../../queries/event-queries';
import { selectIsUnitResearchedQuery } from '../../../queries/unit-research-queries';
import { selectVillageTileIdQuery } from '../../../queries/village-queries';
import { insertUnitResearchReport } from '../../../utils/report';
import {
  areVillageBuildingRequirementsMet,
  isUnitInVillageTribe,
} from '../../../utils/unit-event-validation';
import { apiEffectsJsonSchema } from '../../../utils/zod/effect-schemas';
import { defineEventResolver, type Resolver } from '../resolver';

const resolveUnitResearch: Resolver<GameEvent<'unitResearch'>> = (
  database,
  args,
) => {
  const { villageId, unitId, resolvesAt } = args;

  database.exec({
    sql: `
      INSERT INTO
        unit_research (village_id, unit_id)
      VALUES
        ($village_id, (
          SELECT id
          FROM
            unit_ids
          WHERE
            unit = $unit_id
          ));
    `,
    bind: {
      $village_id: villageId,
      $unit_id: unitId,
    },
  });

  insertUnitResearchReport(database, {
    villageId,
    timestamp: resolvesAt,
    unitId,
  });

  return {
    affectedVillageIds: [villageId],
    affectedTileIds: [],
  };
};

export const unitResearchResolver = defineEventResolver<'unitResearch'>(
  (database, event) => ({
    validate: () => {
      const { unitId, villageId } = event;
      const unit = getUnitDefinition(unitId);

      if (!isUnitInVillageTribe(database, villageId, unit)) {
        throw new Error('Unit does not belong to village tribe');
      }

      const hasOngoingUnitResearchEventsInThisVillage = database.selectValue({
        sql: selectVillageEventExistsByTypeQuery,
        bind: {
          $village_id: villageId,
          $type: 'unitResearch',
        },
        schema: z.coerce.boolean(),
      });

      if (hasOngoingUnitResearchEventsInThisVillage) {
        throw new Error('Academy is busy');
      }

      const hasAlreadyResearchedUnitsWithSameIdAndVillage =
        database.selectValue({
          sql: selectIsUnitResearchedQuery,
          bind: {
            $village_id: villageId,
            $unit_id: unitId,
          },
          schema: z.coerce.boolean(),
        });

      if (hasAlreadyResearchedUnitsWithSameIdAndVillage) {
        throw new Error('Unit is already researched');
      }

      if (
        !areVillageBuildingRequirementsMet(
          database,
          villageId,
          unit.researchRequirements,
        )
      ) {
        throw new Error('Unit research requirements are not met');
      }
    },
    cost: () => {
      const isFreeUnitResearchEnabled = database.selectValue({
        sql: 'SELECT is_free_unit_research_enabled FROM developer_settings',
        schema: z.coerce.boolean(),
      });

      if (isFreeUnitResearchEnabled) {
        return [0, 0, 0, 0];
      }

      const { unitId } = event;
      return calculateUnitResearchCost(unitId);
    },
    duration: () => {
      const isInstantUnitResearchEnabled = database.selectValue({
        sql: 'SELECT is_instant_unit_research_enabled FROM developer_settings',
        schema: z.coerce.boolean(),
      });

      if (isInstantUnitResearchEnabled) {
        return 0;
      }

      const { villageId, unitId } = event;

      const effects = database.selectValue({
        sql: selectAllRelevantEffectsByIdQuery,
        bind: {
          $effect_id: 'unitResearchDuration',
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

      const { total: unitResearchDurationModifier } = calculateComputedEffect(
        'unitResearchDuration',
        effects,
        tileId,
      );

      return (
        unitResearchDurationModifier * calculateUnitResearchDuration(unitId)
      );
    },
  }),
  resolveUnitResearch,
);
