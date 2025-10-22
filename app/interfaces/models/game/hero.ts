import { z } from 'zod';

export const heroResourceToProduceSchema = z.enum([
  'wood',
  'clay',
  'iron',
  'wheat',
  'shared',
]);

export const heroSchema = z.strictObject({
  stats: z.strictObject({
    health: z.number(),
    experience: z.number(),
  }),
  selectableAttributes: z.strictObject({
    attackPower: z.number(),
    resourceProduction: z.number(),
    attackBonus: z.number(),
    defenceBonus: z.number(),
  }),
  resourceToProduce: heroResourceToProduceSchema,
});

export type Hero = z.infer<typeof heroSchema>;
