import { z } from 'zod';

export const resourceBundleSchema = z
  .tuple([z.int().min(0), z.int().min(0), z.int().min(0), z.int().min(0)])
  .meta({ id: 'ResourceBundle' });

export const resourceSchema = z
  .enum(['wood', 'clay', 'iron', 'wheat'])
  .meta({ id: 'Resource' });

export const resourcesSchema = z
  .strictObject({
    wood: z.number().int().min(0),
    clay: z.number().int().min(0),
    iron: z.number().int().min(0),
    wheat: z.number().int().min(0),
  })
  .meta({ id: 'Resources' });

export type Resource = z.infer<typeof resourceSchema>;
export type ResourceBundle = z.infer<typeof resourceBundleSchema>;
export type Resources = z.infer<typeof resourcesSchema>;
