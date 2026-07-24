import { z } from 'zod';

export const resourceBundleSchema = z
  .tuple([z.int(), z.int(), z.int(), z.int()])
  .meta({ id: 'ResourceBundle' });

export const resourceSchema = z
  .enum(['wood', 'clay', 'iron', 'wheat'])
  .meta({ id: 'Resource' });

export type Resource = z.infer<typeof resourceSchema>;
export type ResourceBundle = z.infer<typeof resourceBundleSchema>;

export type Resources = Record<Resource, number>;
