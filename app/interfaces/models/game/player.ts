import type { PlayableTribe } from 'app/interfaces/models/game/tribe';

// Plan is to add multiple factions, where you'd have different relations with each
export type PlayerFaction = 'player' | 'npc1' | 'npc2' | 'npc3' | 'npc4' | 'npc5' | 'npc6' | 'npc7' | 'npc8';

export type Player = {
  id: string;
  name: string;
  tribe: PlayableTribe;
  faction: PlayerFaction;
};
