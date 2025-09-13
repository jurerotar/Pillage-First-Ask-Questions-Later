import type { HeroItem } from 'app/interfaces/models/game/hero';
import type { Tile } from 'app/interfaces/models/game/tile';

export type WorldItem = {
  id: HeroItem['id'];
  name: HeroItem['name'];
  amount: number;
  tileId: Tile['id'];
  type: HeroItem['category'];
};
