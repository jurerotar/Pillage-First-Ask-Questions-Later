import { z } from 'zod';
import { effectSchema } from '@pillage-first/types/models/effect';

export const apiEffectSchema = effectSchema.meta({ id: 'ApiEffect' });

export const apiEffectsJsonSchema = z
  .string()
  .transform((value) => JSON.parse(value))
  .pipe(z.array(apiEffectSchema));
