import type { z } from 'zod';
import { questSchema } from '@pillage-first/types/models/quest';
import type { getQuestsRowSchema } from '../schemas/quest-schemas';

export const mapQuestRowToDto = (row: z.infer<typeof getQuestsRowSchema>) =>
  questSchema.parse({
    id: row.quest_id,
    scope: row.scope,
    collectedAt: row.collected_at,
    completedAt: row.completed_at,
    ...(row.village_id !== null && { villageId: row.village_id }),
  });
