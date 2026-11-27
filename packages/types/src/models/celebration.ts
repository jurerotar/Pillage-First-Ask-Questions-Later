import { z } from 'zod';

export const culturePointsCelebrationTypeSchema = z.enum(['small', 'large']);

export type CulturePointsCelebrationType = z.infer<
  typeof culturePointsCelebrationTypeSchema
>;
