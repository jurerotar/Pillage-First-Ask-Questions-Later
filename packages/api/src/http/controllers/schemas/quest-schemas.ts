import { z } from 'zod';
import { questIdSchema } from '@pillage-first/types/models/quest';

export const getQuestsRowSchema = z
  .strictObject({
    quest_id: questIdSchema,
    scope: z.enum(['village', 'global']),
    collected_at: z.number().nullable(),
    completed_at: z.number().nullable(),
    village_id: z.number().nullable(),
  })
  .meta({ id: 'GetQuestsRow' });
