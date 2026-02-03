import { z } from 'zod';
import type { Quest } from '@pillage-first/types/models/quest';

export const getQuestsSchema = z
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
      ...(t.village_id !== null && {
        villageId: t.village_id,
      }),
    };
  });
