import { z } from 'zod';

export const reportTypeSchema = z.enum(['battle', 'adventure', 'trade']);

export const reportSchema = z.strictObject({
  id: z.int(),
  villageId: z.int(),
  timestamp: z.int(),
  type: reportTypeSchema,
  is_read: z.boolean(),
  is_archived: z.boolean(),
});

export type Report = z.infer<typeof reportSchema>;
