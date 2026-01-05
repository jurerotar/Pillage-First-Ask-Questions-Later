import { z } from 'zod';
import { factionSchema } from 'app/interfaces/models/game/faction';

export const reputationLevelSchema = z.enum([
  'player',
  'ecstatic',
  'honored',
  'respected',
  'friendly',
  'neutral',
  'unfriendly',
  'hostile',
  'hated',
]);

export type ReputationLevel = z.infer<typeof reputationLevelSchema>;

export const reputationSchema = z.strictObject({
  faction: factionSchema,
  reputation: z.number().positive().or(z.literal(0)),
  reputationLevel: reputationLevelSchema,
});

export type Reputation = z.infer<typeof reputationSchema>;
