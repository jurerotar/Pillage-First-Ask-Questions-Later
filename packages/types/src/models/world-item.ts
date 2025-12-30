import type { HeroItem } from './hero-item';
import type { Tile } from './tile';

export type WorldItem = {
  id: HeroItem['id'];
  name: HeroItem['name'];
  amount: number;
  tileId: Tile['id'];
  type: HeroItem['category'];
};
