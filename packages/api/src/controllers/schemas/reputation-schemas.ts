import { z } from 'zod';
import { factionSchema } from '@pillage-first/types/models/faction';
import { getReputationLevel } from '@pillage-first/utils/reputation';

export const getReputationsSchema = z
  .strictObject({
    faction: factionSchema,
    reputation: z.number(),
  })
  .transform((t) => ({
    faction: t.faction,
    reputation: t.reputation,
    reputationLevel: getReputationLevel(t.reputation),
  }));
