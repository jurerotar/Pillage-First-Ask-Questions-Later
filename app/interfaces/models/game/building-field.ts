import type { Building } from 'app/interfaces/models/game/building';
import type { Village } from 'app/interfaces/models/game/village';

// Resource fields only, these are predetermined on village creation and cannot be changed
export type ResourceFieldId =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18;

// Player may construct any building on any of these fields
type VillageFieldId =
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 30
  | 31
  | 32
  | 33
  | 34
  | 35
  | 36
  | 37
  | 38;

// Rally point and wall are always on the same spot, these spots can't be taken by other buildings, nor can a player build anything else here
type ReservedFieldId = 39 | 40;

export type BuildingFieldModel = {
  village_id: Village['id'];
  field_id: ResourceFieldId | VillageFieldId | ReservedFieldId;
  building_id: Building['id'];
  level: number;
};

export type BuildingField = {
  id: BuildingFieldModel['field_id'];
  buildingId: Building['id'];
  level: number;
};
