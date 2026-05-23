import { z } from 'zod';
import {
  reportOutcomeSchema,
  reportTagSchema,
  reportTypeSchema,
} from '@pillage-first/types/models/report';

export const reportRowSchema = z.strictObject({
  id: z.number(),
  type: reportTypeSchema,
  timestamp: z.number(),
  village_id: z.number(),
  defender_tile_id: z.number(),
  outcome: reportOutcomeSchema,
  tags: z
    .string()
    .transform((s) => z.array(reportTagSchema).parse(JSON.parse(s))),
  payload: z.string(),
});

export type ReportRow = z.infer<typeof reportRowSchema>;
