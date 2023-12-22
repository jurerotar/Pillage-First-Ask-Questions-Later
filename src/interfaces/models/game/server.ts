import { Tribe } from 'interfaces/models/game/tribe';

export type ServerConfiguration = {
  speed: 1 | 3 | 5 | 10;
  mapSize: 100 | 200;
};

export type PlayerConfiguration = {
  tribe: Tribe;
};

export type Server = {
  id: string;
  name: string;
  slug: string;
  startDate: string;
  seed: string;
  configuration: ServerConfiguration;
  playerConfiguration: PlayerConfiguration;
};

export type WithServerId<T> = T & {
  serverId: Server['id'];
};
