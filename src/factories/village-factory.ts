import { Village } from 'interfaces/models/game/village';
import { Point } from 'interfaces/models/common';
import { Server } from 'interfaces/models/game/server';

type VillageFactoryProps = {
  server: Server;
  coordinates: Point;
};

export const villageFactory = ({ server, coordinates, }: VillageFactoryProps): Village => {
  return {
    serverId: server.id,
  }
};
