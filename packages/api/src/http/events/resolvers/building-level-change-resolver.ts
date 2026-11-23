import {
  calculatePopulationDifference,
  getBuildingDefinition,
} from '@pillage-first/game-assets/utils/buildings';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import { tribeSchema } from '@pillage-first/types/models/tribe';
import {
  updateBuildingEffectQuery,
  updatePopulationEffectQuery,
} from '../../../queries/effect-queries';
import { selectTribeByVillageId } from '../../../queries/village-queries';
import {
  getBuildingChangeDuration,
  getBuildingLevelChangeCost,
  validateBuildingQueue,
  validateDowngrade,
} from '../../../utils/buildings';
import { updatePlayerCulturePointsAt } from '../../../utils/culture-points';
import { updateOasisEffectsForVillage } from '../../../utils/oasis';
import { assessBuildingQuestCompletion } from '../../../utils/quests';
import { promoteNextScheduledBuildingUpgrade } from '../../../utils/scheduled-building-upgrades';
import {
  getVillagePlayerId,
  getVillageTileId,
  updateResourceSiteResourcesAt,
} from '../../../utils/village';
import { defineEventResolver, type Resolver } from '../resolver';

const resolveBuildingLevelChange: Resolver<GameEvent<'buildingLevelChange'>> = (
  database,
  args,
  createEvents,
) => {
  const {
    buildingFieldId,
    level,
    buildingId,
    villageId,
    previousLevel,
    resolvesAt,
  } = args;

  const tileId = getVillageTileId(database, villageId);

  updateResourceSiteResourcesAt(database, tileId, resolvesAt);

  updatePlayerCulturePointsAt(
    database,
    resolvesAt,
    getVillagePlayerId(database, villageId),
  );

  database.exec({
    sql: `
      UPDATE building_fields
      SET level = $level
      FROM building_ids bi
      WHERE village_id = $village_id
        AND field_id = $building_field_id
        AND bi.id = building_fields.building_id
        AND bi.building = $building_id;
    `,
    bind: {
      $village_id: villageId,
      $building_field_id: buildingFieldId,
      $building_id: buildingId,
      $level: level,
    },
  });

  // Update population effect
  const populationDifference = calculatePopulationDifference(
    buildingId,
    previousLevel,
    level,
  );

  if (populationDifference !== 0) {
    database.exec({
      sql: updatePopulationEffectQuery,
      bind: {
        $village_id: villageId,
        $value: populationDifference,
      },
    });
  }

  // Update effects
  const tribe = database.selectValue({
    sql: selectTribeByVillageId,
    bind: { $village_id: villageId },
    schema: tribeSchema,
  })!;

  const effects = getBuildingDefinition(buildingId).effects(tribe);

  if (effects.length === 1 || effects.length >= 8) {
    for (const { effectId, valuesPerLevel, type } of effects) {
      database.exec({
        sql: updateBuildingEffectQuery,
        bind: {
          $effect_id: effectId,
          $value: valuesPerLevel[level],
          $type: type,
          $village_id: villageId,
          $source_specifier: buildingFieldId,
        },
      });
    }
  } else {
    database.exec({
      sql: `
        UPDATE effects
        SET value = json_extract(effect.value, '$.value')
        FROM
          json_each($effects) AS effect
          JOIN effect_ids
            ON effect_ids.effect = json_extract(effect.value, '$.effectId')
          JOIN effect_type_ids
            ON effect_type_ids.type = json_extract(effect.value, '$.type')
        WHERE
          effects.effect_id = effect_ids.id
          AND effects.type_id = effect_type_ids.id
          AND effects.scope_id = (
            SELECT id FROM effect_scope_ids WHERE scope = 'local'
          )
          AND effects.source_id = (
            SELECT id FROM effect_source_ids WHERE source = 'building'
          )
          AND effects.tile_id = (
            SELECT tile_id FROM villages WHERE id = $village_id
          )
          AND effects.source_specifier = $source_specifier;
      `,
      bind: {
        $effects: JSON.stringify(
          effects.map(({ effectId, valuesPerLevel, type }) => ({
            effectId,
            type,
            value: valuesPerLevel[level],
          })),
        ),
        $village_id: villageId,
        $source_specifier: buildingFieldId,
      },
    });
  }

  if (buildingId === 'WATERWORKS') {
    updateOasisEffectsForVillage(database, villageId);
  }

  const isLevelIncreasing = previousLevel < level;

  const hasCapacityEffects = effects.some(({ effectId }) => {
    return effectId === 'warehouseCapacity' || effectId === 'granaryCapacity';
  });

  if (level < previousLevel && hasCapacityEffects) {
    updateResourceSiteResourcesAt(database, tileId, resolvesAt);
  }

  if (isLevelIncreasing) {
    assessBuildingQuestCompletion(
      database,
      villageId,
      buildingId,
      level,
      resolvesAt,
    );

    promoteNextScheduledBuildingUpgrade(
      createEvents,
      database,
      villageId,
      resolvesAt,
      buildingFieldId,
    );
  }

  return {
    affectedVillageIds: [villageId],
    affectedTileIds: [tileId],
  };
};

export const buildingLevelChangeResolver =
  defineEventResolver<'buildingLevelChange'>(
    (database, event) => ({
      validate: () => {
        const { villageId, buildingFieldId, buildingId, level, previousLevel } =
          event;

        if (previousLevel > level) {
          validateDowngrade(database, villageId);
          return;
        }

        validateBuildingQueue(database, villageId, buildingFieldId);
        const { maxLevel } = getBuildingDefinition(buildingId);

        if (level > maxLevel) {
          throw new Error('Building level cannot exceed max level');
        }
      },
      cost: () => getBuildingLevelChangeCost(database, event),
      duration: () =>
        getBuildingChangeDuration(
          database,
          event,
          event.previousLevel > event.level,
        ),
      chargeAt: (startsAt) => startsAt,
    }),
    resolveBuildingLevelChange,
  );
