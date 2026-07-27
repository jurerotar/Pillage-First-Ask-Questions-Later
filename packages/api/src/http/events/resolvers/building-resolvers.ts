import {
  calculatePopulationDifference,
  getBuildingDataForLevel,
  getBuildingDefinition,
} from '@pillage-first/game-assets/utils/buildings';
import { specialFieldIds } from '@pillage-first/types/models/building-field';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import {
  updateBuildingEffectQuery,
  updatePopulationEffectQuery,
} from '../../../queries/effect-queries';
import { createBuildingPlaceholder } from '../../../utils/building-placeholder';
import { createEvents } from '../../../utils/create-event';
import { assessBuildingQuestCompletion } from '../../../utils/quests';
import { processScheduledBuildingUpgrades } from '../../../utils/scheduled-building-upgrades';
import {
  demolishBuilding,
  updateVillageResourcesAt,
} from '../../../utils/village';
import type { Resolver } from '../resolver';

export const buildingLevelChangeResolver: Resolver<
  GameEvent<'buildingLevelChange'>
> = (database, args) => {
  const {
    buildingFieldId,
    level,
    buildingId,
    villageId,
    previousLevel,
    resolvesAt,
  } = args;

  // Update building level
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
  const { effects } = getBuildingDefinition(buildingId);

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
        AND effects.village_id = $village_id
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

  const isLevelIncreasing = previousLevel < level;

  if (isLevelIncreasing) {
    assessBuildingQuestCompletion(
      database,
      villageId,
      buildingId,
      level,
      resolvesAt,
    );
  }

  updateVillageResourcesAt(database, villageId, resolvesAt);
  processScheduledBuildingUpgrades(database, villageId);

  return {
    affectedVillageIds: [villageId],
  };
};

export const buildingConstructionResolver: Resolver<
  GameEvent<'buildingConstruction'>
> = (database, args) => {
  const {
    villageId,
    buildingFieldId,
    buildingId,
    level,
    previousLevel,
    startsAt,
  } = args;

  createBuildingPlaceholder(database, villageId, buildingFieldId, buildingId);

  createEvents<'buildingLevelChange'>(database, {
    villageId,
    level,
    previousLevel,
    startsAt,
    buildingFieldId,
    buildingId,
    type: 'buildingLevelChange',
  });

  return {
    affectedVillageIds: [villageId],
  };
};

export const buildingDestructionResolver: Resolver<
  GameEvent<'buildingDestruction'>
> = (database, args) => {
  const { buildingFieldId, villageId, buildingId, previousLevel } = args;

  // Remove building field
  demolishBuilding(database, villageId, buildingFieldId);

  // Remove or reset building effects depending on whether the building can be fully destroyed
  const { effects } = getBuildingDefinition(buildingId);

  const isNonDestroyable = specialFieldIds.some((id) => id === buildingFieldId);

  if (isNonDestroyable) {
    // Building stays at level 0 → keep the effect rows but set their values to level 0
    if (effects.length === 1 || effects.length >= 8) {
      for (const { effectId, valuesPerLevel, type } of effects) {
        database.exec({
          sql: updateBuildingEffectQuery,
          bind: {
            $effect_id: effectId,
            $value: valuesPerLevel[0],
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
          AND effects.village_id = $village_id
          AND effects.source_specifier = $source_specifier;
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
    }
  } else {
    // Fully destroyable building → remove its effect rows entirely
    if (effects.length === 1) {
      database.exec({
        sql: `
          DELETE FROM effects
          WHERE
            village_id = $village_id
            AND effect_id = (
              SELECT id FROM effect_ids WHERE effect = $effect_id
            )
            AND source_specifier = $source_specifier;
        `,
        bind: {
          $village_id: villageId,
          $effect_id: effects[0]!.effectId,
          $source_specifier: buildingFieldId,
        },
      });
    } else {
      database.exec({
        sql: `
        DELETE
        FROM effects
        WHERE village_id = $village_id
          AND effect_id IN (
            SELECT effect_ids.id
            FROM
              json_each($effect_ids) AS effect
              JOIN effect_ids ON effect_ids.effect = effect.value
          )
          AND source_specifier = $source_specifier;
      `,
        bind: {
          $village_id: villageId,
          $effect_ids: JSON.stringify(effects.map(({ effectId }) => effectId)),
          $source_specifier: buildingFieldId,
        },
      });
    }
  }

  // Reduce population
  const { population } = getBuildingDataForLevel(buildingId, previousLevel);
  const { population: level0Population } = getBuildingDataForLevel(
    buildingId,
    0,
  );

  database.exec({
    sql: updatePopulationEffectQuery,
    bind: {
      $village_id: villageId,
      $value: -population + (isNonDestroyable ? level0Population : 0),
    },
  });

  return {
    affectedVillageIds: [villageId],
  };
};

export const buildingScheduledConstructionEventResolver: Resolver<
  GameEvent<'buildingScheduledConstruction'>
> = (database, args) => {
  const { villageId } = args;
  processScheduledBuildingUpgrades(database, villageId);

  return {
    affectedVillageIds: [villageId],
  };
};
