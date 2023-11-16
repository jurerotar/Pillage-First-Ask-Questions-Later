import { serverMock } from 'mocks/models/game/server-mock';
import { OccupiedFreeTile, Tile } from 'interfaces/models/game/tile';
import { predefinedVillagesCoordinates100x100Mock } from 'mocks/game/map/predefined-villages-coordinates-mock';
import { Point } from 'interfaces/models/common';
import { mapFactory } from 'factories/map-factory';
import { playersMock } from 'mocks/models/game/player-mock';

const serverMockSize100 = serverMock;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const serverMockSize200 = {
  ...serverMock,
  configuration: {
    ...serverMock.configuration,
    size: 200 // 40401
  }
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const serverMockSize400 = {
  ...serverMock,
  configuration: {
    ...serverMock.configuration,
    size: 400 // 160801
  }
};

const predefinedVillagesTests = (name: string, tile: OccupiedFreeTile) => {
  describe(`${name} village at [${tile.coordinates.x}, ${tile.coordinates.y}]`, () => {
    test('is a free-tile', () => {
      expect(tile.type === 'free-tile')
        .toBe(true);
    });
    describe('Resource field composition', () => {
      test('exists', () => {
        expect(Object.hasOwn(tile, 'resourceFieldComposition'))
          .toBe(true);
      });
      test('is of type "4446"', () => {
        expect(tile?.resourceFieldComposition)
          .toBe('4446');
      });
    });
  });
};

const percentage = (a: number, b: number) => (a / b) * 100;

const expectToBeCloseTo = (amount: number, expected: number, amountOfTiles: number): void => {
  const acceptableDeviation = 2;
  expect(percentage(amount, amountOfTiles))
    .toBeGreaterThan(expected - acceptableDeviation);
  expect(percentage(amount, amountOfTiles))
    .toBeLessThan(expected + acceptableDeviation);
};

describe('Map factory', () => {
  describe('100x100 map size', () => {
    const tiles = mapFactory({ server: serverMockSize100, players: playersMock });

    describe('Grid generation', () => {
      test('Creates an array of correct size', () => {
        expect(tiles.length)
          .toBe(10201);
      });
      describe('Each tile contains required properties', () => {
        test('serverId, equal to server.id', () => {
          expect(tiles.every((tile: Tile) => Object.hasOwn(tile, 'serverId') && tile.serverId === serverMock.id))
            .toBe(true);
        });
        test('coordinates', () => {
          expect(tiles.every((tile: Tile) => Object.hasOwn(tile, 'coordinates')))
            .toBe(true);
        });
        test('type, if it\'s a free tile, or oasisType, if it\'s an oasis tile', () => {
          expect(tiles.every((tile: Tile) => Object.hasOwn(tile, 'type')))
            .toBe(true);
        });
        test('All tiles are either oasis or free tile', () => {
          const oasis = tiles.filter((tile: Tile) => tile.type === 'oasis-tile');
          const freeTiles = tiles.filter((tile: Tile) => tile.type === 'free-tile');
          expect(oasis.length + freeTiles.length)
            .toBe(tiles.length);
        });
      });
    });

    describe('Village generation', () => {
      predefinedVillagesTests('Initial user', tiles.find(({ coordinates }) => coordinates.x === 0 && coordinates.y === 0)! as OccupiedFreeTile);

      const { artifactVillagesCoordinates } = predefinedVillagesCoordinates100x100Mock;

      artifactVillagesCoordinates.forEach((mockCoordinates: Point) => {
        const {
          x,
          y
        } = mockCoordinates;
        predefinedVillagesTests('Artifact', tiles.find(({ coordinates }) => coordinates.x === x && coordinates.y === y)! as OccupiedFreeTile);
      });
    });
  });

  // describe('200x200 map size', () => {
  //   const tiles = MapGeneratorService.generateMap(serverMockSize200);
  // });
  //
  // describe('400x400 map size', () => {
  //   const tiles = MapGeneratorService.generateMap(serverMockSize400);
  // });

  // All of these tests are limited by randomness, so we must give some leeway
  // describe('Tile type occurrence', () => {
  //   const normalFields = tiles.filter((tile: Tile) => !tile.type !== null);
  //   const oasis = tiles.filter((tile: Tile) => tile.oasisType !== null);
  //

  //
  // TODO: Re-enable this test once nice percentages are defined
  // describe('oasis', () => {
  //   test('Approximately 40% of all fields are oasis', () => {
  //     expectToBeCloseTo(oasis.length, 40);
  //   });
  // });
  //
  // describe('normal fields', () => {
  //   test('Approximately 60% of all fields are normal fields', () => {
  //     expectToBeCloseTo(normalFields.length, 60);
  //   });
  //   test('Approximately 20% of fields are "4446" fields', () => {
  //     const fields4446 = normalFields.filter((tile: Tile) => tile.type === '4446');
  //     expectToBeCloseTo(fields4446.length, 20);
  //   });
  //   test('Approximately 32% of fields are "3456", "4356", "3546", "4536", "5346" or "5436" fields', () => {
  //     const fieldsWith5 = normalFields.filter((tile: Tile) => tile.type?.includes('5') && tile.type !== '11115');
  //     expectToBeCloseTo(fieldsWith5.length, 32);
  //   });
  //   test('Approximately 5% of fields are "4437", "4347" or "3447" fields', () => {
  //     const fieldsWith7 = normalFields.filter((tile: Tile) => tile.type?.includes('7'));
  //     expectToBeCloseTo(fieldsWith7.length, 5);
  //   });
  //   test('Approximately 1% of fields are "3339", "11115" or "00018" fields', () => {
  //     const cropperFields = normalFields.filter((tile: Tile) => ['3339', '11115', '00018'].includes(tile.type!));
  //     expectToBeCloseTo(cropperFields.length, 1);
  //   });
  // });
});
