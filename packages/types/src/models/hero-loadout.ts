import { z } from 'zod';

export const heroLoadoutSlotSchema = z.enum([
  'head',
  'horse',
  'torso',
  'legs',
  'right-hand',
  'left-hand',
  'consumable',
]).meta({ id: 'HeroLoadoutSlot' });

export const heroLoadoutSchema = z.strictObject({
  itemId: z.number(),
  slot: heroLoadoutSlotSchema,
  amount: z.number().min(1),
}).meta({ id: 'HeroLoadout' });
