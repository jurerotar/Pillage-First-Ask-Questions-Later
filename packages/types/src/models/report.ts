import { z } from 'zod';
import { battleTypeSchema } from './battle';

export const reportTypeSchema = z.enum(['battle', 'adventure', 'trade']);

export const combatResultIdSchema = z.enum([
  'ATTACKER_NO_LOSS',
  'ATTACKER_SOME_LOSS',
  'ATTACKER_FULL_LOSS',
  'DEFENDER_NO_LOSS',
  'DEFENDER_SOME_LOSS',
  'DEFENDER_FULL_LOSS',
] as const);

export const reportStateTags = ['READ', 'ARCHIVED'] as const;

export const reportTagSchema = z.enum(reportStateTags);

export const baseReportSchema = z.strictObject({
  id: z.int(),
  playerId: z.int(),
  villageId: z.int(),
  timestamp: z.int(),
  subject: z.string(),
  combatResultId: combatResultIdSchema.nullable(),
  tags: z.array(reportTagSchema),
});

export const battleReportSchema = baseReportSchema.extend({
  type: z.literal('battle'),
  combatResultId: combatResultIdSchema,
  battle: battleTypeSchema,
});

export const gameReportSchema = z
  .discriminatedUnion('type', [battleReportSchema])
  .meta({ id: 'GameReport' });

export type ReportType = z.infer<typeof reportTypeSchema>;
export type ReportTag = z.infer<typeof reportTagSchema>;
export type CombatResultId = z.infer<typeof combatResultIdSchema>;

export type BaseReport = z.infer<typeof baseReportSchema>;
export type GameReport = z.infer<typeof gameReportSchema>;
