import type { MapMarker } from 'interfaces/models/game/map-marker';
import type { Server } from 'interfaces/models/game/server';
import type { Tile } from 'interfaces/models/game/tile';

type MapMarkerFactoryProps = {
  serverId: Server['id'];
  tileId: Tile['id'];
};

export const mapMarkerFactory = ({ tileId, serverId }: MapMarkerFactoryProps): MapMarker => {
  return {
    serverId,
    tileId,
  };
};
