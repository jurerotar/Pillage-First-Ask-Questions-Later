import { z } from 'zod';

export const tileLoyaltyDtoSchema = z
  .strictObject({
    loyalty: z.number(),
    nextLoyaltyIncreaseAt: z.number().nullable(),
    loyaltyIncreaseInterval: z.number(),
    loyaltyIncreaseAmount: z.number(),
  })
  .meta({ id: 'TileLoyaltyDto' });

export type TileLoyaltyDto = z.infer<typeof tileLoyaltyDtoSchema>;
