import type { z } from 'zod';
import { effectSchema } from '../models/effect';

export const apiEffectDtoSchema = effectSchema.meta({ id: 'ApiEffectDto' });

export type ApiEffectDto = z.infer<typeof apiEffectDtoSchema>;
