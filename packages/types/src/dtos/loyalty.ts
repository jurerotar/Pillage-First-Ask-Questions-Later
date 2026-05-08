import { z } from 'zod';

export const tileLoyaltyDtoSchema = z
  .strictObject({
    loyalty: z.number(),
  })
  .meta({ id: 'TileLoyaltyDto' });
