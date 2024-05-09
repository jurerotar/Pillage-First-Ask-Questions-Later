import { serverMock } from 'mocks/models/game/server-mock';
import { mapMarkerFactory } from 'app/factories/map-marker-factory';

describe('Mar marker factory', () => {
  const mapMarker = mapMarkerFactory({ tileId: '1', serverId: serverMock.id });

  test('Has correct server id', () => {
    expect(mapMarker.serverId).toBe(serverMock.id);
  });

  test('Has correct tile id', () => {
    expect(mapMarker.tileId).toBe('1');
  });
});
