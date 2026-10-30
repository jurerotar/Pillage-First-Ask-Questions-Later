import { z } from 'zod';

export const heroResourceToProduceSchema = z
  .enum(['wood', 'clay', 'iron', 'wheat', 'shared'])
  .meta({ id: 'HeroResourceToProduce' });

export type HeroResourceToProduce = z.infer<typeof heroResourceToProduceSchema>;

export const heroStatusSchema = z.discriminatedUnion('type', [
  z.strictObject({
    type: z.enum(['stationed', 'reinforcing']),
    tileId: z.number(),
  }),
  z.strictObject({
    type: z.enum(['adventure', 'travel']),
    endsAt: z.number(),
  }),
  z.strictObject({
    type: z.literal('dead'),
  }),
]);

export const heroSchema = z
  .strictObject({
    id: z.number(),
    stats: z.strictObject({
      health: z.number(),
      experience: z.number(),
      attackPower: z.number(),
      healthRegeneration: z.number(),
      damageReduction: z.number(),
      experienceModifier: z.number(),
      speed: z.number(),
      natarianAttackBonus: z.number(),
      attackBonus: z.number(),
      defenceBonus: z.number(),
    }),
    selectableAttributes: z.strictObject({
      attackPower: z.number(),
      resourceProduction: z.number(),
      attackBonus: z.number(),
      defenceBonus: z.number(),
    }),
    resourceToProduce: heroResourceToProduceSchema,
    villageId: z.number(),
    status: heroStatusSchema,
  })
  .meta({ id: 'Hero' });

export type Hero = z.infer<typeof heroSchema>;
