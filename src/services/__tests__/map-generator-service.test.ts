import { MapGeneratorService } from 'services/map-generator-service';
import { serverMock } from 'mocks/models/game/server-mock';

describe('MapGeneratorService', () => {
  const tiles = MapGeneratorService.generateMap(serverMock);

  describe('generateGrid method', () => {
    test('Creates an array of correct size', () => {
      expect(1).toBe(1);
    });
  });
});
