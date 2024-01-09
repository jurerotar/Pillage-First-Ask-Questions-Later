import { Bank } from 'interfaces/models/game/bank';
import { Server } from 'interfaces/models/game/server';

type BankFactoryProps = {
  server: Server;
};

export const bankFactory = ({ server: { id: serverId } }: BankFactoryProps): Bank => {
  return {
    serverId,
    amount: 0,
  };
};
