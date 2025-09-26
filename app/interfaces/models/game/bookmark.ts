import type { Building } from 'app/interfaces/models/game/building';

export type BookmarkModel = {
  building_id: Building['id'];
  tab_name: string;
};

export type Bookmarks = Record<Building['id'], string>;
