import type { HeroItem } from 'app/interfaces/models/game/hero-item';
import { itemsMap } from 'app/assets/items';

export const getItemDefinition = (itemId: HeroItem['id']): HeroItem => {
  return itemsMap.get(itemId)!;
};
