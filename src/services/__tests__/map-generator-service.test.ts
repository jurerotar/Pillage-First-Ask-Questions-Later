import { MapGeneratorService } from 'services/map-generator-service';
import { serverMock } from 'mocks/models/game/server-mock';
import { Tile } from 'interfaces/models/game/tile';

describe('MapGeneratorService', () => {
  const tiles = MapGeneratorService.generateMap(serverMock);

  describe('generateGrid method', () => {
    test('Creates an array of correct size', () => {
      expect(tiles.length).toBe(10201);
    });
    describe('Each tile contains required properties', () => {
      test('serverId, equal to server.id', () => {
        expect(tiles.every((tile: Tile) => Object.hasOwn(tile, 'serverId') && tile.serverId === serverMock.id)).toBe(true);
      });
      test('coordinates', () => {
        expect(tiles.every((tile: Tile) => Object.hasOwn(tile, 'coordinates'))).toBe(true);
      });
      test("type, if it's a normal field", () => {
        const normalFields = tiles.filter((tile: Tile) => !tile.isOasis);
        expect(normalFields.every((tile: Tile) => Object.hasOwn(tile, 'type'))).toBe(true);
      });
      test("oasisType, if it's an oasis", () => {
        const oasis = tiles.filter((tile: Tile) => tile.isOasis);
        expect(oasis.every((tile: Tile) => Object.hasOwn(tile, 'oasisType'))).toBe(true);
      });
      test('All tiles are either oasis or normal fields', () => {
        const oasis = tiles.filter((tile: Tile) => tile.isOasis);
        const normalFields = tiles.filter((tile: Tile) => !tile.isOasis);
        expect(oasis.length + normalFields.length).toBe(tiles.length);
      });
    });

    // All of these tests are limited by randomness, so we give some leeway
    describe('Tile type occurrence', () => {
      const normalFields = tiles.filter((tile: Tile) => !tile.isOasis);
      const oasis = tiles.filter((tile: Tile) => tile.isOasis);

      const percentage = (a: number, b: number) => (a / b) * 100;

      const expectToBeCloseTo = (amount: number, expected: number, acceptableDeviation = 2): void => {
        expect(percentage(amount, tiles.length)).toBeGreaterThan(expected - acceptableDeviation);
        expect(percentage(amount, tiles.length)).toBeLessThan(expected + acceptableDeviation);
      };

      describe('oasis', () => {
        test('Approximately 40% of all fields are oasis', () => {
          expectToBeCloseTo(oasis.length, 40);
        });
      });

      describe('normal fields', () => {
        test('Approximately 60% of all fields are normal fields', () => {
          expectToBeCloseTo(normalFields.length, 60);
        });
        test('Approximately 20% of fields are "4446" fields', () => {
          const fields4446 = normalFields.filter((tile: Tile) => tile.type === '4446');
          expectToBeCloseTo(fields4446.length, 20);
        });
        test('Approximately 32% of fields are "3456", "4356", "3546", "4536", "5346" or "5436" fields', () => {
          const fieldsWith5 = normalFields.filter((tile: Tile) => tile.type?.includes('5') && tile.type !== '11115');
          expectToBeCloseTo(fieldsWith5.length, 32);
        });
        test('Approximately 5% of fields are "4437", "4347" or "3447" fields', () => {
          const fieldsWith7 = normalFields.filter((tile: Tile) => tile.type?.includes('7'));
          expectToBeCloseTo(fieldsWith7.length, 5);
        });
        test('Approximately 1% of fields are "3339", "11115" or "00018" fields', () => {
          const cropperFields = normalFields.filter((tile: Tile) => ['3339', '11115', '00018'].includes(tile.type!));
          expectToBeCloseTo(cropperFields.length, 1);
        });
      });
    });

    describe('Starting tile [0, 0]', () => {
      const middleTile = tiles.find((tile: Tile) => tile.coordinates.x === 0 && tile.coordinates.y === 0);

      test('is not an oasis', () => {
        expect(middleTile?.isOasis).toBe(false);
      });
      test('is occupied', () => {
        expect(middleTile?.isOccupied).toBe(true);
      });
      test('is of type "4446"', () => {
        expect(middleTile?.type).toBe('4446');
      });
    });
  });
});
