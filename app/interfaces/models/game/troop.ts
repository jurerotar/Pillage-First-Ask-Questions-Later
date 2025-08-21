import type { Tile } from 'app/interfaces/models/game/tile';
import type { Unit } from 'app/interfaces/models/game/unit';

export type TroopModel = {
  unit_id: Unit['id'];
  amount: number;
  tile_id: Tile['id'];
  source: Tile['id'];
};

export type Troop = {
  unitId: Unit['id'];
  amount: number;
  tileId: Tile['id'];
  source: Tile['id'];
};
