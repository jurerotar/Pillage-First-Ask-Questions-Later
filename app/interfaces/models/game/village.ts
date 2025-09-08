import type { Building } from 'app/interfaces/models/game/building';
import type { Player } from 'app/interfaces/models/game/player';
import type { Resources } from 'app/interfaces/models/game/resource';
import type { ArtifactId } from 'app/interfaces/models/game/hero';
import type { Tile } from 'app/interfaces/models/game/tile';

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

type VillagePresetVillagePrefix = 'village';
type VillagePresetResourcesPrefix = 'resources';

export type VillagePresetId =
  `${VillagePresetVillagePrefix | VillagePresetResourcesPrefix}-${VillageSize}`;

export type BuildingField = {
  // Resource building ids [1, 18]
  // Village building ids [19, 40]
  // Rally point (39) and wall (40) are always on the same spot, these spots can't be taken by other buildings, nor can a player build anything else here
  id: number;
  buildingId: Building['id'];
  level: number;
};

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

type BaseVillage = {
  id: number;
  tileId: Tile['id'];
  playerId: Player['id'];
  coordinates: {
    x: number;
    y: number;
  };
  name: string;
  lastUpdatedAt: number;
  resources: Resources;
  // This property is only hydrated in user villages or on npc villages that differ from a preset!
  buildingFields: BuildingField[];
  // To reduce the amount of data we need to write, we point to a special preset array that represents "buildingFields" of npc villages,
  // in which case buildingFields only contain the building fields unique to that village
  buildingFieldsPresets: VillagePresetId[];
  RFC: ResourceFieldComposition;
};

export type PlayerVillage = BaseVillage & {
  slug: string;
  artifactId: ArtifactId | null;
};

export type Village = BaseVillage | PlayerVillage;
