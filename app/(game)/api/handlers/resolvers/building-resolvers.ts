import {
  getBuildingDefinition,
  getBuildingDataForLevel,
} from 'app/assets/utils/buildings';
import type { Resolver } from 'app/interfaces/api';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { createEvent } from 'app/(game)/api/handlers/utils/create-event';
import { demolishBuilding } from 'app/(game)/api/utils/village';
import { assessBuildingQuestCompletion } from 'app/(game)/api/utils/quests';

export const buildingLevelChangeResolver: Resolver<
  GameEvent<'buildingLevelChange'>
> = async (_queryClient, database, args) => {
  const { buildingFieldId, level, buildingId, villageId, previousLevel } = args;

  database.transaction((db) => {
    // Update building level
    db.exec(
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
    const { population: currentPopulation } = getBuildingDataForLevel(
      buildingId,
      previousLevel,
    );
    const { population: nextPopulation } = getBuildingDataForLevel(
      buildingId,
      level,
    );

    const populationDifference = Math.abs(nextPopulation - currentPopulation);
    const isLevelIncreasing = previousLevel < level;

    if (populationDifference > 0) {
      db.exec(
        `
          UPDATE effects
          SET value = value + $value
          WHERE (SELECT id
                 FROM effect_ids
                 WHERE effect = 'wheatProduction')
            AND type = 'base'
            AND scope = 'village'
            AND source = 'building'
            AND village_id = $village_id
            AND source_specifier = 0;
        `,
        {
          $village_id: villageId,
          $value: isLevelIncreasing
            ? -populationDifference
            : populationDifference,
        },
      );
    }

    // Update effects
    const { effects } = getBuildingDefinition(buildingId);

    for (const { effectId, valuesPerLevel } of effects) {
      db.exec(
        `
          UPDATE effects
          SET value = $value
          WHERE effect_id = (SELECT id
                             FROM effect_ids
                             WHERE effect = $effect_id)
            AND village_id = $village_id
            AND type = 'base'
            AND scope = 'village'
            AND source = 'building'
            AND source_specifier = $source_specifier;
        `,
        {
          $effect_id: effectId,
          $value: valuesPerLevel[level],
          $village_id: villageId,
          $source_specifier: buildingFieldId,
        },
      );
    }

    db.exec(
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

    if (isLevelIncreasing) {
      assessBuildingQuestCompletion(db);
    }
  });
};

export const buildingConstructionResolver: Resolver<
  GameEvent<'buildingConstruction'>
> = async (_queryClient, database, args) => {
  const { villageId, buildingFieldId, buildingId } = args;

  database.transaction((db) => {
    // Create building field
    db.exec(
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
      db.exec(
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

    db.exec(
      `
        UPDATE effects
        SET value = value + $value
        WHERE effect_id = (SELECT id
                           FROM effect_ids
                           WHERE effect = 'wheatProduction')
          AND type = 'base'
          AND scope = 'village'
          AND source = 'building'
          AND village_id = $village_id
          AND source_specifier = 0;
      `,
      {
        $village_id: villageId,
        $value: population,
      },
    );

    assessBuildingQuestCompletion(db);
  });

  await createEvent<'buildingLevelChange'>(_queryClient, database, {
    ...args,
    type: 'buildingLevelChange',
  });
};

export const buildingDestructionResolver: Resolver<
  GameEvent<'buildingDestruction'>
> = async (_queryClient, database, args) => {
  const { buildingFieldId, villageId, buildingId, previousLevel } = args;

  database.transaction((db) => {
    // Remove building field
    demolishBuilding(db, villageId, buildingFieldId);

    // Remove building effects
    const { effects } = getBuildingDefinition(buildingId);

    for (const { effectId } of effects) {
      db.exec(
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

    // Reduce population
    const { population } = getBuildingDataForLevel(buildingId, previousLevel);

    db.exec(
      `
        UPDATE effects
        SET value = value - $value
        WHERE (SELECT id
               FROM effect_ids
               WHERE effect = 'wheatProduction')
          AND type = 'base'
          AND scope = 'village'
          AND source = 'building'
          AND village_id = $village_id
          AND source_specifier = 0;
      `,
      {
        $village_id: villageId,
        $value: population,
      },
    );
  });
};

export const buildingScheduledConstructionEventResolver: Resolver<
  GameEvent<'buildingScheduledConstruction'>
> = async (_queryClient, database, args) => {
  await createEvent<'buildingLevelChange'>(_queryClient, database, {
    ...args,
    type: 'buildingLevelChange',
  });
};
