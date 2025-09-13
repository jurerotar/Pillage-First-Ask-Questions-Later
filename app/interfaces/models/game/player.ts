import type { PlayableTribe } from 'app/interfaces/models/game/tribe';
import type { FactionModel } from 'app/interfaces/models/game/faction';

export type PlayerModel = {
  id: number;
  name: string;
  tribe: PlayableTribe;
  faction_id: FactionModel['id'];
};

export type Player = {
  id: number;
  name: string;
  tribe: PlayableTribe;
  faction: FactionModel['name'];
};
