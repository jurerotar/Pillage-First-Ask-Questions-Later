import { serverMock } from 'mocks/models/game/server-mock';
import { heroFactory } from 'factories/hero-factory';

describe('Hero factory', () => {
  const hero = heroFactory({ server: serverMock });

  test('Has correct server id', () => {
    expect(hero.serverId).toBe(serverMock.id);
  });

  describe('Hero attributes', () => {
    describe('Speed', () => {
      test('', () => {
        // expect(hero).toBe(0);
      });
    });
  });
});
