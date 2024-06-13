import type { Tribe } from 'interfaces/models/game/tribe';

type ServerConfiguration = {
  speed: 1 | 3 | 5 | 10;
  mapSize: 100;
};

type PlayerConfiguration = {
  name: string;
  tribe: Tribe;
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
