import { z } from 'zod';
import { battleSummarySchema, battleTypeSchema } from '../models/battle';
import {
  combatResultIdSchema,
  reportTagSchema,
  reportTypeSchema,
} from '../models/report';

export const baseReportDtoSchema = z.strictObject({
  id: z.int(),
  playerId: z.int(),
  villageId: z.int(),
  timestamp: z.int(),
  battleSummary: battleSummarySchema,
  type: reportTypeSchema,
  combatResultId: combatResultIdSchema.nullable(),
  tags: z.array(reportTagSchema),
});

export const reportDtoSchema = z.discriminatedUnion('type', [
  z.strictObject({
    id: z.int(),
    playerId: z.int(),
    villageId: z.int(),
    timestamp: z.int(),
    battleSummary: battleSummarySchema,
    type: z.literal('battle'),
    combatResultId: combatResultIdSchema,
    tags: z.array(reportTagSchema),
    battle: battleTypeSchema,
  }),
]);
