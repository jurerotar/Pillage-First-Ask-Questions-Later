import { z } from 'zod';
import { getQuestRewards } from '@pillage-first/game-assets/utils/quests';
import { questIdSchema, questSchema } from '@pillage-first/types/models/quest';
import {
  isHeroExperienceQuestReward,
  isResourceQuestReward,
} from '@pillage-first/utils/guards/quest';
import {
  collectQuestQuery,
  selectCollectableQuestCountQuery,
  selectVillageQuestsQuery,
} from '../../queries/quest-queries';
import { addPlayerCulturePoints } from '../../utils/culture-points';
import { addHeroExperience } from '../../utils/hero';
import {
  addResourceSiteResourcesAt,
  getVillageTileId,
} from '../../utils/village';
import { createController } from '../controller';
import { mapQuestRowToDto } from './mappers/quest-mapper';
import { getQuestsRowSchema } from './schemas/quest-schemas';

export const getQuests = createController('/me/quests', {
  summary: 'Get village quests',
  requestParams: {
    query: z.strictObject({
      villageId: z.coerce.number(),
    }),
  },
  response: z.array(questSchema),
})(({ database, context: { playerId }, query: { villageId } }) => {
  const rows = database.selectObjects({
    sql: selectVillageQuestsQuery,
    bind: {
      $village_id: villageId,
      $player_id: playerId,
    },
    schema: getQuestsRowSchema,
  });

  return rows.map(mapQuestRowToDto);
});

export const getCollectableQuestCount = createController(
  '/me/quests/collectable-count',
  {
    summary: 'Get collectable quests count',
    requestParams: {
      query: z.strictObject({
        villageId: z.coerce.number(),
      }),
    },
    response: z.strictObject({
      collectableQuestCount: z.number(),
    }),
  },
)(({ database, context: { playerId }, query: { villageId } }) => {
  const collectableQuestCount = database.selectValue({
    sql: selectCollectableQuestCountQuery,
    bind: {
      $village_id: villageId,
      $player_id: playerId,
    },
    schema: z.number(),
  })!;

  return {
    collectableQuestCount,
  };
});

export const collectQuest = createController(
  '/me/quests/:questId/collect',
  'post',
  {
    summary: 'Collect quest reward',
    requestBody: z.strictObject({ villageId: z.number().int().positive() }),
    requestParams: {
      path: z.strictObject({
        questId: questIdSchema,
      }),
    },
  },
)(
  ({
    database,
    context: { playerId },
    path: { questId },
    body: { villageId },
  }) => {
    database.transaction(() => {
      const collectedQuestId = database.selectValue({
        sql: collectQuestQuery,
        bind: {
          $collected_at: Date.now(),
          $quest_id: questId,
          $village_id: villageId,
          $player_id: playerId,
        },
        schema: z.number(),
      });

      if (collectedQuestId === undefined) {
        throw new Error('Quest is unavailable or already collected');
      }

      const questRewards = getQuestRewards(questId);

      for (const reward of questRewards) {
        if (reward.type === 'culture-points') {
          addPlayerCulturePoints(database, reward.amount, Date.now(), playerId);
          continue;
        }

        if (isResourceQuestReward(reward)) {
          const { amount } = reward;

          addResourceSiteResourcesAt(
            database,
            getVillageTileId(database, villageId),
            Date.now(),
            [amount, amount, amount, amount],
          );
          continue;
        }

        if (isHeroExperienceQuestReward(reward)) {
          addHeroExperience(database, reward.amount, playerId);
        }
      }
    });
  },
);
