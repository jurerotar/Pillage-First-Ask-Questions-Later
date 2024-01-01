import { Point } from 'interfaces/models/common';
import { Resources } from 'interfaces/models/game/resource';
import { Building } from 'interfaces/models/game/building';
import { Server } from 'interfaces/models/game/server';
import { Player } from 'interfaces/models/game/player';

export type ResourceFieldId =
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | '11'
  | '12'
  | '13'
  | '14'
  | '15'
  | '16'
  | '17'
  | '18';

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

// Just kinda reusing a type, since there's no differences between most ids
export type BuildingFieldId =
  | ResourceFieldId
  | '19'
  | '20';

export type BuildingField = {
  buildingFieldId: BuildingFieldId;
  buildingId: Building['id'];
  level: number;
};

export type EmptyBuildingField = BuildingField & {
  buildingId: null
};

export type Village = {
  serverId: Server['id'];
  id: string;
  playerId: Player['id'];
  name: string;
  slug: string;
  lastUpdatedAt: number;
  coordinates: Point;
  resources: Resources;
  resourceFields: BuildingField[];
  buildingFields: BuildingField[];
  isCapital: boolean;
};

export type VillageBuildingFieldsPresetName =
  | 'new-village';

export type VillageBuildingFieldsPreset = {
  preset: VillageBuildingFieldsPresetName;
  buildingFields: BuildingField[];
};
