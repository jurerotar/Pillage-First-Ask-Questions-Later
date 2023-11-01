import { Bank } from 'interfaces/models/game/bank';
import { Server } from 'interfaces/models/game/server';

type BankFactoryProps = {
  server: Server;
};

export const bankFactory = ({ server }: BankFactoryProps): Bank => {
  return {
    serverId: server.id,
    amount: 0
  };
};
