import type { HeroItem } from '@pillage-first/types/models/hero-item';
import { items, itemsMap } from '../items';

export const getItemDefinition = (itemId: HeroItem['id']): HeroItem => {
  return itemsMap.get(itemId)!;
};

export const getItemByName = (itemName: HeroItem['name']): HeroItem => {
  return items.find(({ name }) => name === itemName)!;
};
