import { z } from 'zod';
import { reportTypeSchema } from '../models/report';

export const reportDtoSchema = z.strictObject({
  id: z.int(),
  playerId: z.int(),
  villageId: z.int(),
  timestamp: z.int(),
  subject: z.string(),
  type: reportTypeSchema,
  isRead: z.boolean(),
  isArchived: z.boolean(),
});
