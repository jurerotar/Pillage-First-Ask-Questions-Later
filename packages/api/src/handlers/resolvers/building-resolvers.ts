import {
  calculatePopulationDifference,
  getBuildingDataForLevel,
  getBuildingDefinition,
} from '@pillage-first/game-assets/buildings/utils';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import type { Resolver } from '../../types/handler';
import {
  updateBuildingEffectQuery,
  updatePopulationEffectQuery,
} from '../../utils/queries/effect-queries';
import { assessBuildingQuestCompletion } from '../../utils/quests';
import {
  demolishBuilding,
  updateVillageResourcesAt,
} from '../../utils/village';
import { createEvents } from '../utils/create-event';

// Some fields are special and cannot be destroyed, because they must exist on a specific field: all resource fields, rally point & wall.
export const specialFieldIds: BuildingField['id'][] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 39, 40,
];

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
  database.exec(
    `
      UPDATE building_fields
      SET level = $level
      WHERE village_id = $village_id
        AND field_id = $building_field_id
        AND building_id = $building_id;
    `,
    {
      $village_id: villageId,
      $building_field_id: buildingFieldId,
      $building_id: buildingId,
      $level: level,
    },
  );

  // Update population effect
  const populationDifference = calculatePopulationDifference(
    buildingId,
    previousLevel,
    level,
  );

  if (populationDifference !== 0) {
    database.exec(updatePopulationEffectQuery, {
      $village_id: villageId,
      $value: populationDifference,
    });
  }

  // Update effects
  const { effects } = getBuildingDefinition(buildingId);

  for (const { effectId, valuesPerLevel } of effects) {
    database.exec(updateBuildingEffectQuery, {
      $effect_id: effectId,
      $value: valuesPerLevel[level],
      $village_id: villageId,
      $source_specifier: buildingFieldId,
    });
  }

  database.exec(
    `
      INSERT INTO building_level_change_history
      (village_id, field_id, building_id, previous_level, new_level, timestamp)
      VALUES ($village_id, $building_field_id, $building_id, $previous_level, $level, STRFTIME('%s', 'now'))
      RETURNING id;
    `,
    {
      $village_id: villageId,
      $building_field_id: buildingFieldId,
      $building_id: buildingId,
      $level: level,
      $previous_level: previousLevel,
    },
  );

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
};

export const buildingConstructionResolver: Resolver<
  GameEvent<'buildingConstruction'>
> = (database, args) => {
  const { villageId, buildingFieldId, buildingId } = args;

  // Create building field
  database.exec(
    `
      INSERT INTO building_fields (village_id, field_id, building_id, level)
      VALUES ($village_id, $field_id, $building_id, 0)
    `,
    {
      $village_id: villageId,
      $field_id: buildingFieldId,
      $building_id: buildingId,
    },
  );

  // Create building effects
  const { effects } = getBuildingDefinition(buildingId);

  for (const { effectId, valuesPerLevel, type } of effects) {
    database.exec(
      `
        INSERT INTO effects (effect_id, value, type, scope, source, village_id, source_specifier)
        VALUES ((SELECT id FROM effect_ids WHERE effect = $effect_id), $value, $type, 'village', 'building',
                $village_id, $source_specifier);
      `,
      {
        $effect_id: effectId,
        $value: valuesPerLevel[0],
        $type: type,
        $village_id: villageId,
        $source_specifier: buildingFieldId,
      },
    );
  }

  // Update population effect
  const { population } = getBuildingDataForLevel(buildingId, 0);

  database.exec(updatePopulationEffectQuery, {
    $village_id: villageId,
    $value: population,
  });

  createEvents<'buildingLevelChange'>(database, {
    ...args,
    type: 'buildingLevelChange',
  });
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
    for (const { effectId, valuesPerLevel } of effects) {
      database.exec(updateBuildingEffectQuery, {
        $effect_id: effectId,
        $value: valuesPerLevel[0],
        $village_id: villageId,
        $source_specifier: buildingFieldId,
      });
    }
  } else {
    // Fully destroyable building → remove its effect rows entirely
    for (const { effectId } of effects) {
      database.exec(
        `
        DELETE
        FROM effects
        WHERE village_id = $village_id
          AND effect_id = (SELECT id FROM effect_ids WHERE effect = $effect_id)
          AND source_specifier = $source_specifier;
      `,
        {
          $village_id: villageId,
          $effect_id: effectId,
          $source_specifier: buildingFieldId,
        },
      );
    }
  }

  // Reduce population
  const { population } = getBuildingDataForLevel(buildingId, previousLevel);
  const { population: level0Population } = getBuildingDataForLevel(
    buildingId,
    0,
  );

  database.exec(updatePopulationEffectQuery, {
    $village_id: villageId,
    $value: -population + (isNonDestroyable ? level0Population : 0),
  });
};

export const buildingScheduledConstructionEventResolver: Resolver<
  GameEvent<'buildingScheduledConstruction'>
> = (database, args) => {
  createEvents<'buildingLevelChange'>(database, {
    ...args,
    type: 'buildingLevelChange',
  });
};
