import { z } from 'zod';

export const PLAYABLE_TRIBES = [
  'gauls',
  'romans',
  'teutons',
  'egyptians',
  'huns',
] as const;

export const FUTURE_PLAYABLE_TRIBES = ['spartans'] as const;

export const NPC_ONLY_TRIBES = ['nature', 'natars'] as const;

export const playableTribeSchema = z.enum(PLAYABLE_TRIBES);

export type PlayableTribe = z.infer<typeof playableTribeSchema>;

export const futurePlayableTribeSchema = z.enum(FUTURE_PLAYABLE_TRIBES);

export const npcOnlyTribeSchema = z.enum(NPC_ONLY_TRIBES);

export const tribeSchema = z
  .enum([...PLAYABLE_TRIBES, ...FUTURE_PLAYABLE_TRIBES, ...NPC_ONLY_TRIBES])
  .meta({ id: 'Tribe' });

export type Tribe = z.infer<typeof tribeSchema>;
