import { Bank } from 'interfaces/models/game/bank';
import { serverMock } from 'mocks/models/game/server-mock';

export const bankMock: Bank = {
  serverId: serverMock.id,
  amount: 0,
};
