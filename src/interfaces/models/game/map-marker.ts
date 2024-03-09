import { WithServerId } from 'interfaces/models/game/server';
import { Tile } from 'interfaces/models/game/tile';

export type MapMarker = WithServerId<{
  tileId: Tile['id'];
}>;
