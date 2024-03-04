import { serverFactory } from 'app/factories/server-factory';

describe('Server factory', () => {
  const server = serverFactory({
    name: 'server-factory-test',
    seed: '00000000',
    configuration: {
      speed: 1,
      mapSize: 100,
    },
    playerConfiguration: {
      name: 'Player name',
      tribe: 'gauls',
    },
  });

  test('Has id', () => {
    expect(Object.hasOwn(server, 'id')).toBe(true);
  });

  test('Has start date', () => {
    expect(Object.hasOwn(server, 'createdAt')).toBe(true);
  });

  test('Server slug starts with "s-"', () => {
    expect(server.slug.startsWith('s-')).toBe(true);
  });
});
