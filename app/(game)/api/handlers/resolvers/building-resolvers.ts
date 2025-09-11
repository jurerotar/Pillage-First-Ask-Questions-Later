import { getBuildingData } from 'app/(game)/(village-slug)/utils/building';
import { newBuildingEffectFactory } from 'app/factories/effect-factory';
import type { Resolver } from 'app/interfaces/api';
import type { Effect } from 'app/interfaces/models/game/effect';
import { effectsCacheKey } from 'app/(game)/(village-slug)/constants/query-keys';
import type { GameEvent } from 'app/interfaces/models/game/game-event';
import { isBuildingEffect } from 'app/(game)/(village-slug)/hooks/guards/effect-guards';
import { createEvent } from 'app/(game)/api/handlers/utils/create-event';
import { evaluateQuestCompletions } from 'app/(game)/api/utils/quests';
import { demolishBuilding } from 'app/(game)/api/utils/village';

export const buildingLevelChangeResolver: Resolver<
  GameEvent<'buildingLevelChange'>
> = async (queryClient, database, args) => {
  const { buildingFieldId, level, buildingId, villageId } = args;

  database.exec({
    sql: `
      UPDATE building_fields
      SET level = $level
      WHERE village_id = $village_id
      AND field_id = $building_field_id
      AND building_id = $building_id;
    `,
    bind: {
      $village_id: villageId,
      $building_field_id: buildingFieldId,
      $building_id: buildingId,
      $level: level,
    },
  });

  const { effects: buildingEffects } = getBuildingData(buildingId);

  queryClient.setQueryData<Effect[]>([effectsCacheKey], (prevData) => {
    const buildingEffectsWithoutCurrentBuildingEffects = prevData!.filter(
      (effect) => {
        return !(
          isBuildingEffect(effect) &&
          effect.villageId === villageId &&
          effect.buildingFieldId === buildingFieldId
        );
      },
    );

    return [
      ...buildingEffectsWithoutCurrentBuildingEffects,
      ...buildingEffects.map(({ effectId, valuesPerLevel, type }) => {
        return newBuildingEffectFactory({
          villageId,
          id: effectId,
          value: valuesPerLevel[level],
          buildingFieldId,
          buildingId,
          type,
        });
      }),
    ];
  });

  evaluateQuestCompletions(queryClient);
};

export const buildingConstructionResolver: Resolver<
  GameEvent<'buildingConstruction'>
> = async (queryClient, database, args) => {
  const { villageId, buildingFieldId, buildingId } = args;

  database.exec({
    sql: `
      INSERT INTO building_fields (village_id, field_id, building_id, level)
      VALUES ($village_id, $field_id, $building_id, 0)
    `,
    bind: {
      $village_id: villageId,
      $field_id: buildingFieldId,
      $building_id: buildingId,
    },
  });

  const { effects } = getBuildingData(buildingId);

  queryClient.setQueryData<Effect[]>([effectsCacheKey], (prevData) => {
    const newEffects = effects.map(({ effectId, valuesPerLevel, type }) => {
      return newBuildingEffectFactory({
        id: effectId,
        villageId,
        value: valuesPerLevel[0],
        buildingFieldId,
        buildingId,
        type,
      });
    });
    return [...prevData!, ...newEffects];
  });

  await createEvent<'buildingLevelChange'>(queryClient, database, {
    ...args,
    type: 'buildingLevelChange',
  });
};

export const buildingDestructionResolver: Resolver<
  GameEvent<'buildingDestruction'>
> = async (queryClient, database, args) => {
  const { buildingFieldId, villageId } = args;

  demolishBuilding(database, villageId, buildingFieldId);

  queryClient.setQueryData<Effect[]>([effectsCacheKey], (prevData) => {
    // Loop through all effects added by the building, find corresponding village effects and delete them
    return prevData!.filter((effect) => {
      return !(
        isBuildingEffect(effect) &&
        effect.villageId === villageId &&
        effect.buildingFieldId === buildingFieldId
      );
    });
  });
};

export const buildingScheduledConstructionEventResolver: Resolver<
  GameEvent<'buildingScheduledConstruction'>
> = async (queryClient, database, args) => {
  await createEvent<'buildingLevelChange'>(queryClient, database, {
    ...args,
    type: 'buildingLevelChange',
  });
};
