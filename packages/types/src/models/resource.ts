import { z } from 'zod';

export const resourceSchema = z
  .enum(['wood', 'clay', 'iron', 'wheat'])
  .meta({ id: 'Resource' });

export type Resource = z.infer<typeof resourceSchema>;

export type Resources = Record<Resource, number>;
