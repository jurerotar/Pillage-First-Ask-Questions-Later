import type { PlayableTribe } from 'app/interfaces/models/game/tribe';

type ServerSpeed = 1 | 2 | 3 | 5 | 10;
type ServerMapSize = 100 | 200 | 300;

export type ServerModel = {
  id: string;
  version: string;
  name: string;
  slug: string;
  created_at: number;
  seed: string;
  speed: ServerSpeed;
  map_size: ServerMapSize;
  player_name: string;
  player_tribe: PlayableTribe;
};

type ServerConfiguration = {
  speed: ServerSpeed;
  mapSize: ServerMapSize;
};

type PlayerConfiguration = {
  name: string;
  tribe: PlayableTribe;
};

export type Server = {
  id: string;
  version: string;
  name: string;
  slug: string;
  createdAt: number;
  seed: string;
  configuration: ServerConfiguration;
  playerConfiguration: PlayerConfiguration;
};
