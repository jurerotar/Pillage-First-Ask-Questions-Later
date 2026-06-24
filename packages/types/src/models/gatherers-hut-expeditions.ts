import { z } from 'zod';

export const gatherersHutExpeditionsSchema = z
  .strictObject({
    completed: z.number(),
  })
  .meta({ id: 'GatherersHutExpeditions' });
