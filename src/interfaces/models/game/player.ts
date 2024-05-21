import type { WithServerId } from 'interfaces/models/game/server';
import type { Tribe } from 'interfaces/models/game/tribe';

// Plan is to add multiple factions, where you'd have different relations with each
export type PlayerFaction = 'player' | 'npc1' | 'npc2' | 'npc3' | 'npc4' | 'npc5' | 'npc6' | 'npc7' | 'npc8';

export type Player = WithServerId<{
  id: string;
  name: string;
  tribe: Tribe;
  faction: PlayerFaction;
}>;
