import { WithServerId } from 'interfaces/models/game/server';

// Plan is to add multiple factions, where you'd have different relations with each
export type PlayerFaction =
  | 'player'
  | 'npc1'
  | 'npc2'
  | 'npc3'
  | 'npc4';

export type Player = WithServerId<{
  id: string;
  faction: PlayerFaction
}>;
