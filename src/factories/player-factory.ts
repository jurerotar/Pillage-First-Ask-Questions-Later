import { Server } from 'interfaces/models/game/server';
import { Player, PlayerFaction } from 'interfaces/models/game/player';

type PlayerFactoryProps = {
  server: Server;
  faction: PlayerFaction;
};

export const playerFactory = ({ server, faction }: PlayerFactoryProps): Player => {
  return {
    id: crypto.randomUUID(),
    serverId: server.id,
    faction
  };
};
