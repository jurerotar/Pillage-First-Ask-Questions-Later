import { z } from 'zod';
import { battleTypeSchema } from '../models/battle';
import { reportTagSchema, reportTypeSchema } from '../models/report';

export const baseReportDtoSchema = z.strictObject({
  id: z.int(),
  playerId: z.int(),
  villageId: z.int(),
  timestamp: z.int(),
  subject: z.string(),
  type: reportTypeSchema,
  tags: z.array(reportTagSchema),
});

export const reportDtoSchema = z.discriminatedUnion('type', [
  z.strictObject({
    id: z.int(),
    playerId: z.int(),
    villageId: z.int(),
    timestamp: z.int(),
    subject: z.string(),
    type: z.literal('battle'),
    tags: z.array(reportTagSchema),
    battle: battleTypeSchema,
  }),
]);
