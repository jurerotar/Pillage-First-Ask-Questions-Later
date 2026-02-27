import { z } from 'zod';
import { factionSchema } from './faction';

export const reputationLevelSchema = z
  .enum([
    'player',
    'ecstatic',
    'honored',
    'respected',
    'friendly',
    'neutral',
    'unfriendly',
    'hostile',
    'hated',
  ])
  .meta({ id: 'ReputationLevel' });

export type ReputationLevel = z.infer<typeof reputationLevelSchema>;

export const reputationSchema = z
  .strictObject({
    faction: factionSchema,
    reputation: z.number().positive().or(z.literal(0)),
    reputationLevel: reputationLevelSchema,
  })
  .meta({ id: 'Reputation' });

export type Reputation = z.infer<typeof reputationSchema>;
