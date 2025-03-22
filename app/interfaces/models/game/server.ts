import type { PlayableTribe } from 'app/interfaces/models/game/tribe';

type ServerConfiguration = {
  speed: 1 | 2 | 3 | 5 | 10;
  mapSize: 100 | 200;
};

type PlayerConfiguration = {
  name: string;
  tribe: PlayableTribe;
};

export type Server = {
  id: string;
  name: string;
  slug: string;
  createdAt: number;
  seed: string;
  configuration: ServerConfiguration;
  playerConfiguration: PlayerConfiguration;
};
