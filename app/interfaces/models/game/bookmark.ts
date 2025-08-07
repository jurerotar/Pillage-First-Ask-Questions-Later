import type { Building } from 'app/interfaces/models/game/building';

export type BookmarkSchema = {
  building_id: Building['id'];
  tab_id: string;
};

export type Bookmarks = Record<Building['id'], string>;
