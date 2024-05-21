import type { WithServerId } from 'interfaces/models/game/server';
import type { Tile } from 'interfaces/models/game/tile';

export type MapMarker = WithServerId<{
  tileId: Tile['id'];
}>;
