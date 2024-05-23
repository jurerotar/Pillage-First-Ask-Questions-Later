import { playerFactory } from 'app/factories/player-factory';
import { serverMock } from 'mocks/models/game/server-mock';
import { prng_alea } from 'esm-seedrandom';

describe('Player factory', () => {
  const prng = prng_alea(serverMock.seed);
  const player = playerFactory({ server: serverMock, faction: 'npc1', prng });

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
