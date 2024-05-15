import { playerFactory } from 'app/factories/player-factory';
import { serverMock } from 'mocks/models/game/server-mock';

describe('Player factory', () => {
  const player = playerFactory({ server: serverMock, faction: 'npc1', index: 1 });

  test('Has correct server id', () => {
    expect(player.serverId).toBe(serverMock.id);
  });

  test('Player has a tribe', () => {
    expect(Object.hasOwn(player, 'tribe')).toBe(true);
  });

  test('Player has a name', () => {
    expect(Object.hasOwn(player, 'name')).toBe(true);
  });
});
