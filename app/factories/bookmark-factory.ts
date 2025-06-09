import { buildings } from 'app/(game)/(village-slug)/assets/buildings';
import type { Bookmarks } from 'app/interfaces/models/game/bookmark';

export const bookmarkFactory = (): Bookmarks => {
  return buildings.reduce((acc, { id }) => {
    acc[id] = 'default';
    return acc;
  }, {} as Bookmarks);
};
