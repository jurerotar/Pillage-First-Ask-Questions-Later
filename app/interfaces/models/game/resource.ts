import { z } from 'zod';

export const resourceSchema = z.enum(['wood', 'clay', 'iron', 'wheat']);

export type Resource = z.infer<typeof resourceSchema>;

export type Resources = Record<Resource, number>;
