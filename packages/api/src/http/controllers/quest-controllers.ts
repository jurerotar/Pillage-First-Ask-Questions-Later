import { z } from 'zod';
import { getQuestRewards } from '@pillage-first/game-assets/utils/quests';
import type { Quest } from '@pillage-first/types/models/quest';
import { questSchema } from '@pillage-first/types/models/quest';
import {
  isHeroExperienceQuestReward,
  isResourceQuestReward,
} from '@pillage-first/utils/guards/quest';
import {
  collectQuestQuery,
  selectCollectableQuestCountQuery,
  selectVillageQuestsQuery,
} from '../../queries/quest-queries';
import { addHeroExperience } from '../../utils/hero';
import { addVillageResourcesAt } from '../../utils/village';
import { createController } from '../controller';
import { mapQuestRowToDto } from './mappers/quest-mapper';
import { getQuestsRowSchema } from './schemas/quest-schemas';

export const getQuests = createController('/villages/:villageId/quests', {
  summary: 'Get village quests',
  requestParams: {
    path: z.strictObject({
      villageId: z.coerce.number(),
    }),
  },
  response: z.array(questSchema),
})(({ database, path: { villageId } }) => {
  const rows = database.selectObjects({
    sql: selectVillageQuestsQuery,
    bind: {
      $village_id: villageId,
    },
    schema: getQuestsRowSchema,
  });

  return rows.map(mapQuestRowToDto);
});

export const getCollectableQuestCount = createController(
  '/villages/:villageId/quests/collectables/count',
  {
    summary: 'Get collectable quests count',
    requestParams: {
      path: z.strictObject({
        villageId: z.coerce.number(),
      }),
    },
    response: z.strictObject({
      collectableQuestCount: z.number(),
    }),
  },
)(({ database, path: { villageId } }) => {
  const collectableQuestCount = database.selectValue({
    sql: selectCollectableQuestCountQuery,
    bind: {
      $village_id: villageId,
    },
    schema: z.number(),
  })!;

  return {
    collectableQuestCount,
  };
});

export const collectQuest = createController(
  '/villages/:villageId/quests/:questId/collect',
  'patch',
  {
    summary: 'Collect quest reward',
    requestParams: {
      path: z.strictObject({
        villageId: z.coerce.number(),
        questId: z.string(),
      }),
    },
  },
)(({ database, path: { questId, villageId } }) => {
  database.exec({
    sql: collectQuestQuery,
    bind: {
      $collected_at: Date.now(),
      $quest_id: questId,
      $village_id: villageId,
    },
  });

  const questRewards = getQuestRewards(questId as Quest['id']);

  for (const reward of questRewards) {
    if (isResourceQuestReward(reward)) {
      const { amount } = reward;

      addVillageResourcesAt(database, villageId, Date.now(), [
        amount,
        amount,
        amount,
        amount,
      ]);
      continue;
    }

    if (isHeroExperienceQuestReward(reward)) {
      addHeroExperience(database, reward.amount);
    }
  }
});
