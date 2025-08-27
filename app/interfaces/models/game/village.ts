import type { Player } from 'app/interfaces/models/game/player';
import type { Resources } from 'app/interfaces/models/game/resource';
import type { Tile } from 'app/interfaces/models/game/tile';
import type { BuildingField } from 'app/interfaces/models/game/building-field';

export type ResourceFieldComposition =
  | '4446'
  | '5436'
  | '5346'
  | '4536'
  | '3546'
  | '4356'
  | '3456'
  | '4437'
  | '4347'
  | '3447'
  | '3339'
  | '11115'
  | '00018';

// Used mostly for map and village factory
export type VillageSize =
  | 'xxs'
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl';

export type VillageModel = {
  id: number;
  tile_id: Tile['id'];
  player_id: Player['id'];
  coordinates_x: number;
  coordinates_y: number;
  name: string;
  slug: string;
  last_updated_at: number;
  wood: number;
  clay: number;
  iron: number;
  wheat: number;
  resource_field_composition: ResourceFieldComposition;
  // Stringified Omit<BuildingFieldModel, 'village_id'>[]
  building_fields: string;
};

export type Village = {
  id: number;
  tileId: Tile['id'];
  playerId: Player['id'];
  coordinates: {
    x: number;
    y: number;
  };
  name: string;
  slug: string;
  lastUpdatedAt: number;
  resources: Resources;
  buildingFields: BuildingField[];
  resourceFieldComposition: ResourceFieldComposition;
};
