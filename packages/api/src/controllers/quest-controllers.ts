import { z } from 'zod';
import { getQuestRewards } from '@pillage-first/game-assets/quests/utils';
import type { Quest } from '@pillage-first/types/models/quest';
import {
  isHeroExperienceQuestReward,
  isResourceQuestReward,
} from '@pillage-first/utils/guards/quest';
import { createController } from '../utils/controller';
import { addVillageResourcesAt } from '../utils/village';
import { getQuestsSchema } from './schemas/quest-schemas';
import { addHeroExperience } from './utils/hero';

export const getQuests = createController('/villages/:villageId/quests')(
  ({ database, path: { villageId } }) => {
    return database.selectObjects({
      sql: `
        SELECT quest_id, scope, collected_at, completed_at, village_id
        FROM
          (
            SELECT quest_id, scope, collected_at, completed_at, village_id
            FROM
              quests
            WHERE
              village_id = $village_id

            UNION ALL

            SELECT quest_id, scope, collected_at, completed_at, village_id
            FROM
              quests
            WHERE
              village_id IS NULL
            ) AS q
      `,
      bind: {
        $village_id: villageId,
      },
      schema: getQuestsSchema,
    });
  },
);

export const getCollectableQuestCount = createController(
  '/villages/:villageId/quests/collectables/count',
)(({ database, path: { villageId } }) => {
  const collectableQuestCount = database.selectValue({
    sql: `
      SELECT COUNT(*) AS COUNT
      FROM
        quests
      WHERE
        completed_at IS NOT NULL
        AND collected_at IS NULL
        AND (
        village_id =
        $village_id
        OR village_id IS NULL
        );
    `,
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
)(({ database, path: { questId, villageId } }) => {
  database.exec({
    sql: `
      UPDATE quests
      SET
        collected_at = $collected_at
      WHERE
        id = (
          SELECT id
          FROM
            quests
          WHERE
            quest_id = $quest_id
            AND (village_id = $village_id OR village_id IS NULL)
          ORDER BY (village_id = $village_id) DESC, (village_id IS NULL) DESC
          LIMIT 1
          );
    `,
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
