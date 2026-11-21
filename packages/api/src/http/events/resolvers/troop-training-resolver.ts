import { z } from 'zod';
import { getUnitDefinition } from '@pillage-first/game-assets/utils/units';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { mapResourceBundle } from '@pillage-first/types/models/resource';
import { tileIdSchema } from '@pillage-first/types/models/tile';
import { tribeSchema } from '@pillage-first/types/models/tribe';
import { calculateComputedEffect } from '@pillage-first/utils/game/calculate-computed-effect';
import {
  isAsclepeion,
  isHealingTroopTrainingBuilding,
  isHospital,
} from '@pillage-first/utils/guards/building';
import {
  selectAllRelevantEffectsByIdQuery,
  updateWheatProductionByTroopsAndTileIdEffectQuery,
} from '../../../queries/effect-queries';
import { selectIsUnitResearchedQuery } from '../../../queries/unit-research-queries';
import {
  selectTribeByVillageId,
  selectVillageTileIdQuery,
} from '../../../queries/village-queries';
import { requireVillageBuildingLevel } from '../../../utils/buildings';
import {
  assessQueuedTroopCountByIdQuestCompletion,
  assessQueuedTroopCountQuestCompletion,
} from '../../../utils/quests';
import {
  getWoundedTroopAmountAt,
  materializeWoundedTroopsAt,
  removeWoundedTroops,
} from '../../../utils/troops';
import {
  areVillageBuildingRequirementsMet,
  doesTroopTrainingBuildingMatchUnit,
  doesTroopTrainingDurationEffectMatchBuilding,
} from '../../../utils/unit-event-validation';
import {
  getVillagePlayerId,
  getVillageTileId,
  updateResourceSiteResourcesAt,
} from '../../../utils/village';
import { apiEffectsJsonSchema } from '../../../utils/zod/effect-schemas';
import { defineEventResolver, type Resolver } from '../resolver';

const resolveTroopTraining: Resolver<GameEvent<'troopTraining'>> = (
  database,
  event,
) => {
  const { unitId, villageId } = event;
  const { resolvesAt } = event;
  const tileId = getVillageTileId(database, villageId);

  updateResourceSiteResourcesAt(database, tileId, resolvesAt);

  database.exec({
    sql: `
      INSERT
      INTO
        troops (unit_id, amount, tile_id, source_tile_id)
      VALUES (
        (
          SELECT id
          FROM unit_ids
          WHERE unit = $unit_id
        ),
        $amount,
        $tile_id,
        $tile_id
      )
      ON CONFLICT(unit_id, tile_id, source_tile_id) DO UPDATE SET
        amount = amount + excluded.amount;
    `,
    bind: {
      $unit_id: unitId,
      // Each stored event resolves one troop. Its amount is the batch size.
      $amount: 1,
      $tile_id: tileId,
    },
  });

  const { unitWheatConsumption } = getUnitDefinition(unitId);

  database.exec({
    sql: updateWheatProductionByTroopsAndTileIdEffectQuery,
    bind: {
      $increase_amount: unitWheatConsumption,
      $tile_id: tileId,
    },
  });

  return {
    affectedVillageIds: [villageId],
    affectedTileIds: [tileId],
  };
};

export const troopTrainingEventResolver = defineEventResolver<'troopTraining'>(
  (database, event) => {
    const { villageId, unitId, buildingId, durationEffectId, amount } = event;
    const isHealing = isHealingTroopTrainingBuilding(buildingId);

    const afterInsert = (now: number) => {
      if (isHealing) {
        materializeWoundedTroopsAt(database, villageId, now);
        removeWoundedTroops(database, [{ villageId, unitId, amount }]);

        return;
      }

      const playerId = getVillagePlayerId(database, villageId);

      assessQueuedTroopCountQuestCompletion(database, now, playerId);

      assessQueuedTroopCountByIdQuestCompletion(
        database,
        unitId,
        now,
        playerId,
      );
    };

    return {
      validate: (now) => {
        const unit = getUnitDefinition(unitId);

        const tribe = database.selectValue({
          sql: selectTribeByVillageId,
          bind: { $village_id: villageId },
          schema: tribeSchema,
        })!;

        if (unit.tribe !== 'all' && unit.tribe !== tribe) {
          throw new Error('Unit does not belong to village tribe');
        }

        if (unit.researchRequirements.length > 0) {
          const isUnitResearched = database.selectValue({
            sql: selectIsUnitResearchedQuery,
            bind: {
              $village_id: villageId,
              $unit_id: unitId,
            },
            schema: z.coerce.boolean(),
          });

          if (!isUnitResearched) {
            throw new Error('Unit is not researched');
          }
        }

        requireVillageBuildingLevel(
          database,
          villageId,
          buildingId,
          'Unit training building does not exist',
        );

        if (!doesTroopTrainingDurationEffectMatchBuilding(event)) {
          throw new Error(
            'Unit training duration effect does not match building',
          );
        }

        if (isHealing) {
          if (isAsclepeion(buildingId) && tribe !== 'spartans') {
            throw new Error('Asclepeion can only be used by Spartans');
          }

          if (isHospital(buildingId) && tribe === 'spartans') {
            throw new Error('Spartans must use the Asclepeion');
          }

          if (unit.category !== 'infantry' && unit.category !== 'cavalry') {
            throw new Error('Only infantry and cavalry can be healed');
          }

          const woundedAmount = getWoundedTroopAmountAt(
            database,
            villageId,
            unitId,
            now,
          );

          if (amount > woundedAmount) {
            throw new Error('Not enough wounded troops available');
          }
          return;
        }

        if (!doesTroopTrainingBuildingMatchUnit(unit, buildingId)) {
          throw new Error(
            'Unit training building does not match unit category',
          );
        }

        if (
          !areVillageBuildingRequirementsMet(
            database,
            villageId,
            unit.recruitmentRequirements,
          )
        ) {
          throw new Error('Unit recruitment requirements are not met');
        }
      },
      cost: () => {
        const isFreeUnitTrainingEnabled = database.selectValue({
          sql: 'SELECT is_free_unit_training_enabled FROM developer_settings',
          schema: z.coerce.boolean(),
        });

        if (isFreeUnitTrainingEnabled) {
          return [0, 0, 0, 0];
        }

        const { baseRecruitmentCost } = getUnitDefinition(unitId);

        const costModifier =
          buildingId === 'GREAT_BARRACKS' || buildingId === 'GREAT_STABLE'
            ? 3
            : 1;

        return mapResourceBundle(
          baseRecruitmentCost,
          (cost) => cost * costModifier * amount,
        );
      },
      startTime: () => {
        return database.selectValue({
          sql: `
            SELECT COALESCE(MAX(resolves_at), $now)
            FROM
              events
            WHERE
              type = 'troopTraining'
              AND (village_id = $village_id OR village_id IS NULL)
              AND json_extract(meta, '$.buildingId') = $building_id;
          `,
          bind: {
            $village_id: villageId,
            $building_id: buildingId,
            $now: Date.now(),
          },
          schema: z.number(),
        })!;
      },
      duration: () => {
        const isInstantUnitTrainingEnabled = database.selectValue({
          sql: 'SELECT is_instant_unit_training_enabled FROM developer_settings',
          schema: z.coerce.boolean(),
        });

        if (isInstantUnitTrainingEnabled) {
          return 0;
        }

        const effects = database.selectValue({
          sql: selectAllRelevantEffectsByIdQuery,
          bind: {
            $effect_id: durationEffectId,
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
          durationEffectId,
          effects,
          tileId,
        );

        const { baseRecruitmentDuration } = getUnitDefinition(unitId);

        const durationModifier = isHealing ? 0.5 : 1;

        return total * baseRecruitmentDuration * durationModifier;
      },
      afterInsert: (_startsAt, now) => afterInsert(now),
    };
  },
  resolveTroopTraining,
);
