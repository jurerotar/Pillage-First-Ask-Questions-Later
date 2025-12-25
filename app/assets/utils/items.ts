import { itemsMap } from 'app/assets/items';
import type { HeroItem } from 'app/interfaces/models/game/hero-item';

export const getItemDefinition = (itemId: HeroItem['id']): HeroItem => {
  return itemsMap.get(itemId)!;
};
