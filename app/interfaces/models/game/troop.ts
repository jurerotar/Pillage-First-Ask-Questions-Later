import type { Tile } from 'app/interfaces/models/game/tile';
import type { Unit } from 'app/interfaces/models/game/unit';

export type Troop = {
  unitId: Unit['id'];
  amount: number;
  tileId: Tile['id'];
  source: Tile['id'];
};
