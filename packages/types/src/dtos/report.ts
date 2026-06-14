import { z } from 'zod';
import { reportTypeSchema } from '../models/report';

export const reportDtoSchema = z.strictObject({
  id: z.int(),
  villageId: z.int(),
  timestamp: z.int(),
  type: reportTypeSchema,
  is_read: z.boolean(),
  is_archived: z.boolean(),
});
