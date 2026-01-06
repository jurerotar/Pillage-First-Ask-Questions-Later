import type { HeroItem } from '@pillage-first/types/models/hero-item';
import { itemsMap } from '../items';

export const getItemDefinition = (itemId: HeroItem['id']): HeroItem => {
  return itemsMap.get(itemId)!;
};
