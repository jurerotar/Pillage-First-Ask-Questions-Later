import type { MapMarker } from 'interfaces/models/game/map-marker';
import type { Tile } from 'interfaces/models/game/tile';

type MapMarkerFactoryProps = {
  tileId: Tile['id'];
};

export const mapMarkerFactory = ({ tileId }: MapMarkerFactoryProps): MapMarker => {
  return {
    tileId,
  };
};
