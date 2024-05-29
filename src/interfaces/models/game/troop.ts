import type { WithServerId } from 'interfaces/models/game/server';
import type { Tile } from 'interfaces/models/game/tile';
import type { Unit } from 'interfaces/models/game/unit';

export type Troop = WithServerId<{
  unitId: Unit['id'];
  amount: number;
  tileId: Tile['id'];
  source: Tile['id'];
  level: number;
}>;
