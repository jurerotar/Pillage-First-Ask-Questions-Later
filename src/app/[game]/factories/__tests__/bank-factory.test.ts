import { serverMock } from 'mocks/models/game/server-mock';
import { bankFactory } from 'app/[game]/factories/bank-factory';

describe('Bank factory', () => {
  const bank = bankFactory({ server: serverMock });

  test('Has correct server id', () => {
    expect(bank.serverId).toBe(serverMock.id);
  });

  test('Gold amount is always 0 at server creation', () => {
    expect(bank.amount).toBe(0);
  });
});
