import { z } from 'zod';
import { factionSchema } from '@pillage-first/types/models/faction';

export const getReputationsRowSchema = z
  .strictObject({
    faction: factionSchema,
    reputation: z.number(),
  })
  .meta({ id: 'GetReputationsRow' });
