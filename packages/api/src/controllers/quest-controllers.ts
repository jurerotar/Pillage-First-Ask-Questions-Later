import { z } from 'zod';
import { getQuestRewards } from '@pillage-first/game-assets/quests/utils';
import type { Quest } from '@pillage-first/types/models/quest';
import {
  isHeroExperienceQuestReward,
  isResourceQuestReward,
} from '@pillage-first/utils/guards/quest';
import type { Controller } from '../types/controller';
import { addVillageResourcesAt } from '../utils/village';
import { addHeroExperience } from './utils/hero';

const getQuestsSchema = z
  .strictObject({
    quest_id: z.string().brand<Quest['id']>(),
    scope: z.enum(['village', 'global']),
    collected_at: z.number().nullable(),
    completed_at: z.number().nullable(),
    village_id: z.number().nullable(),
  })
  .transform((t) => {
    return {
      id: t.quest_id,
      scope: t.scope,
      collectedAt: t.collected_at,
      completedAt: t.completed_at,
      ...(t.village_id && {
        villageId: t.village_id,
      }),
    };
  });

/**
 * GET /villages/:villageId/quests
 * @pathParam {number} villageId
 */
export const getQuests: Controller<'/villages/:villageId/quests'> = (
  database,
  { params },
) => {
  const { villageId } = params;

  const rows = database.selectObjects(
    `
      SELECT *
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
    {
      $village_id: villageId,
    },
  );

  return z.array(getQuestsSchema).parse(rows);
};

/**
 * GET /quests/collectable-count
 */
export const getCollectableQuestCount: Controller<
  '/quests/collectable-count'
> = (database) => {
  const collectableQuestCount = database.selectValue(
    `
      SELECT COUNT(*) AS count
      FROM
        quests
      WHERE
        completed_at IS NOT NULL
        AND collected_at IS NULL;
    `,
  ) as number;

  return {
    collectableQuestCount,
  };
};

/**
 * POST /villages/:villageId/quests/:questId/collect
 * @pathParam {number} villageId
 * @pathParam {string} questId
 */
export const collectQuest: Controller<
  '/villages/:villageId/quests/:questId/collect',
  'post'
> = (database, args) => {
  const {
    params: { questId, villageId },
  } = args;

  database.exec(
    `
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
    {
      $collected_at: Date.now(),
      $quest_id: questId,
      $village_id: villageId,
    },
  );

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
};
