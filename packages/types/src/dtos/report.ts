import { z } from 'zod';
import { battleTypeSchema } from '../models/battle';
import { reportTypeSchema } from '../models/report';

export const baseReportDtoSchema = z.strictObject({
  id: z.int(),
  playerId: z.int(),
  villageId: z.int(),
  timestamp: z.int(),
  subject: z.string(),
  type: reportTypeSchema,
  isRead: z.boolean(),
  isArchived: z.boolean(),
});

export const reportDtoSchema = z.discriminatedUnion('type', [
  z.strictObject({
    id: z.int(),
    playerId: z.int(),
    villageId: z.int(),
    timestamp: z.int(),
    subject: z.string(),
    type: z.literal('battle'),
    isRead: z.boolean(),
    isArchived: z.boolean(),
    battle: battleTypeSchema,
  }),
]);
