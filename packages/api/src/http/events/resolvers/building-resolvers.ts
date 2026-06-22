import { PLAYER_ID } from '@pillage-first/game-assets/player';
import {
  calculateCulturePointsDifference,
  calculatePopulationDifference,
  getBuildingDataForLevel,
  getBuildingDefinition,
} from '@pillage-first/game-assets/utils/buildings';
import { specialFieldIds } from '@pillage-first/types/models/building-field';
import type { GameEvent } from '@pillage-first/types/models/game-event';
import {
  insertEffectByEffectNameQuery,
  updateBuildingEffectQuery,
  updatePopulationEffectQuery,
} from '../../../queries/effect-queries';
import { updatePlayerCulturePointsProductionQuery } from '../../../queries/player-queries';
import { createEvents } from '../../../utils/create-event';
import { updatePlayerCulturePointsAt } from '../../../utils/culture-points';
import { assessBuildingQuestCompletion } from '../../../utils/quests';
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

  const culturePointsDifference = calculateCulturePointsDifference(
    buildingId,
    previousLevel,
    level,
  );

  if (culturePointsDifference !== 0) {
    updatePlayerCulturePointsAt(database, resolvesAt);

    database.exec({
      sql: updatePlayerCulturePointsProductionQuery,
      bind: {
        $player_id: PLAYER_ID,
        $value: culturePointsDifference,
      },
    });
  }

  // Update effects
  const { effects } = getBuildingDefinition(buildingId);

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
    resolvesAt,
  } = args;

  // Create building field
  database.exec({
    sql: `
      INSERT INTO building_fields (village_id, field_id, building_id, level)
      SELECT $village_id, $field_id, bi.id, 0
      FROM building_ids bi
      WHERE bi.building = $building_id
    `,
    bind: {
      $village_id: villageId,
      $field_id: buildingFieldId,
      $building_id: buildingId,
    },
  });

  // Create building effects
  const { effects } = getBuildingDefinition(buildingId);

  for (const { effectId, valuesPerLevel, type } of effects) {
    database.exec({
      sql: insertEffectByEffectNameQuery,
      bind: {
        $effect_name: effectId,
        $value: valuesPerLevel[0],
        $type: type,
        $scope: 'village',
        $source: 'building',
        $village_id: villageId,
        $source_specifier: buildingFieldId,
      },
    });
  }

  // Update population effect
  const { culturePoints, population } = getBuildingDataForLevel(buildingId, 0);

  database.exec({
    sql: updatePopulationEffectQuery,
    bind: {
      $village_id: villageId,
      $value: population,
    },
  });

  if (culturePoints !== 0) {
    updatePlayerCulturePointsAt(database, resolvesAt);

    database.exec({
      sql: updatePlayerCulturePointsProductionQuery,
      bind: {
        $player_id: PLAYER_ID,
        $value: culturePoints,
      },
    });
  }

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
  const { buildingFieldId, villageId, buildingId, previousLevel, resolvesAt } =
    args;

  // Remove building field
  demolishBuilding(database, villageId, buildingFieldId);

  // Remove or reset building effects depending on whether the building can be fully destroyed
  const { effects } = getBuildingDefinition(buildingId);

  const isNonDestroyable = specialFieldIds.some((id) => id === buildingFieldId);

  if (isNonDestroyable) {
    // Building stays at level 0 → keep the effect rows but set their values to level 0
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
    // Fully destroyable building → remove its effect rows entirely
    for (const { effectId } of effects) {
      database.exec({
        sql: `
        DELETE
        FROM effects
        WHERE village_id = $village_id
          AND effect_id = (SELECT id FROM effect_ids WHERE effect = $effect_id)
          AND source_specifier = $source_specifier;
      `,
        bind: {
          $village_id: villageId,
          $effect_id: effectId,
          $source_specifier: buildingFieldId,
        },
      });
    }
  }

  // Reduce population
  const { culturePoints, population } = getBuildingDataForLevel(
    buildingId,
    previousLevel,
  );
  const { culturePoints: level0CulturePoints, population: level0Population } =
    getBuildingDataForLevel(buildingId, 0);

  const culturePointsDifference =
    -culturePoints + (isNonDestroyable ? level0CulturePoints : 0);

  if (culturePointsDifference !== 0) {
    updatePlayerCulturePointsAt(database, resolvesAt);

    database.exec({
      sql: updatePlayerCulturePointsProductionQuery,
      bind: {
        $player_id: PLAYER_ID,
        $value: culturePointsDifference,
      },
    });
  }

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

  createEvents<'buildingLevelChange'>(database, {
    ...args,
    type: 'buildingLevelChange',
  });

  return {
    affectedVillageIds: [villageId],
  };
};
