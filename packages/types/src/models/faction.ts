import { z } from 'zod';

export const factionSchema = z.enum([
  'player',
  'npc1',
  'npc2',
  'npc3',
  'npc4',
  'npc5',
  'npc6',
  'npc7',
  'npc8',
]);

export type Faction = z.infer<typeof factionSchema>;
