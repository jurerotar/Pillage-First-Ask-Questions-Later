import { Tribe } from 'interfaces/models/game/tribe';

export type ServerConfiguration = {
  difficulty: 1 | 1.5 | 2;
  speed: 1 | 3 | 5 | 10;
  mapSize: 100 | 200;
  tribe: Tribe;
};

export type Server = {
  id: string;
  name: string;
  slug: string;
  startDate: string;
  seed: string;
  configuration: ServerConfiguration;
};

export type WithServerId<T> = T & {
  serverId: Server['id'];
};
