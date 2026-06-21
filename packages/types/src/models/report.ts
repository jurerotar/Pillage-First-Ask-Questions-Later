import { z } from 'zod';

export const reportTypeSchema = z.enum(['battle', 'adventure', 'trade']);

export const reportSchema = z.strictObject({
  id: z.int(),
  playerId: z.int(),
  villageId: z.int(),
  timestamp: z.int(),
  subject: z.string(),
  type: reportTypeSchema,
  isRead: z.boolean(),
  isArchived: z.boolean(),
});

export type BaseReport = z.infer<typeof reportSchema>;
