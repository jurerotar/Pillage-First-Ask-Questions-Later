import type { z } from 'zod';
import { reputationSchema } from '@pillage-first/types/models/reputation';
import { getReputationLevel } from '@pillage-first/utils/reputation';
import type { getReputationsRowSchema } from '../schemas/reputation-schemas';

export const mapReputationRowToDto = (
  row: z.infer<typeof getReputationsRowSchema>,
) =>
  reputationSchema.parse({
    faction: row.faction,
    reputation: row.reputation,
    reputationLevel: getReputationLevel(row.reputation),
  });
