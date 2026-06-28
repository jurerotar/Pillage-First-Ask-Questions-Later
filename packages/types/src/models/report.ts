import { z } from 'zod';
import { battleTypeSchema } from './battle';

export const reportTypeSchema = z.enum(['battle', 'adventure', 'trade']);

export const reportTagSchema = z.enum(['READ', 'ARCHIVED']);

export const baseReportSchema = z.strictObject({
  id: z.int(),
  playerId: z.int(),
  villageId: z.int(),
  timestamp: z.int(),
  subject: z.string(),
  tags: z.array(reportTagSchema),
});

export const battleReportSchema = baseReportSchema.extend({
  type: z.literal('battle'),
  battle: battleTypeSchema,
});

export const gameReportSchema = z
  .discriminatedUnion('type', [battleReportSchema])
  .meta({ id: 'GameReport' });

export type ReportType = z.infer<typeof reportTypeSchema>;
export type ReportTag = z.infer<typeof reportTagSchema>;

export type BaseReport = z.infer<typeof baseReportSchema>;
export type GameReport = z.infer<typeof gameReportSchema>;
