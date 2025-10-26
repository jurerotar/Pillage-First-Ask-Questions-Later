import type { ApiHandler } from 'app/interfaces/api';
import type { Quest } from 'app/interfaces/models/game/quest';
import {
  isHeroExperienceQuestReward,
  isResourceQuestReward,
} from 'app/(game)/guards/quest-guards';
import { addVillageResourcesAt } from 'app/(game)/api/utils/village';
import { addHeroExperience } from 'app/(game)/api/handlers/utils/hero';
import { getQuestRewards } from 'app/assets/utils/quests';
import { z } from 'zod';

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

export const getQuests: ApiHandler<'villageId'> = (database, { params }) => {
  const { villageId } = params;

  const rows = database.selectObjects(
    `
      SELECT *
      FROM (SELECT quest_id, scope, collected_at, completed_at, village_id
            FROM quests
            WHERE village_id = $village_id

            UNION ALL

            SELECT quest_id, scope, collected_at, completed_at, village_id
            FROM quests
            WHERE village_id IS NULL) AS q
    `,
    {
      $village_id: villageId,
    },
  );

  return z.array(getQuestsSchema).parse(rows);
};

export const getCollectableQuestCount: ApiHandler = (database) => {
  const collectableQuestCount = database.selectValue(
    `
      SELECT COUNT(*) AS count
      FROM quests
      WHERE completed_at IS NOT NULL
        AND collected_at IS NULL;
    `,
  ) as number;

  return {
    collectableQuestCount,
  };
};

export const collectQuest: ApiHandler<'questId' | 'villageId'> = (
  database,
  args,
) => {
  const {
    params: { questId, villageId },
  } = args;

  const questDbId = database.selectValue(
    `
      SELECT id
      FROM quests
      WHERE quest_id = $quest_id
        AND (village_id = $village_id OR village_id IS NULL)
      ORDER BY (village_id = $village_id) DESC, (village_id IS NULL) DESC
      LIMIT 1;
    `,
    {
      $quest_id: questId,
    },
  );

  database.exec(
    `
      UPDATE quests
      SET collected_at = $collected_at
      WHERE id = $id;
    `,
    {
      $collected_at: Date.now(),
      $id: questDbId,
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
