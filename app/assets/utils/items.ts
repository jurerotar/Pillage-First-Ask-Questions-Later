import { itemsMap } from 'app/assets/items';
import type { HeroItem } from 'app/interfaces/models/game/hero';

export const getItemDefinition = (itemId: HeroItem['id']): HeroItem => {
  return itemsMap.get(itemId)!;
};
