import { Unit } from 'interfaces/models/game/unit';
import { WithServerId } from 'interfaces/models/game/server';
import { Tile } from 'interfaces/models/game/tile';

export type Troop = WithServerId<{
  unitId: Unit['id'];
  amount: number;
  tileId: Tile['id'];
}>;
