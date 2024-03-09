import { Tile } from 'interfaces/models/game/tile';
import { MapMarker } from 'interfaces/models/game/map-marker';
import { Server } from 'interfaces/models/game/server';

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
