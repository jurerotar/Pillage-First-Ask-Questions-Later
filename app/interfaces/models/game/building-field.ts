import type { Building } from 'app/interfaces/models/game/building';
import type { Village } from 'app/interfaces/models/game/village';

export type BuildingFieldModel = {
  village_id: Village['id'];
  field_id: number;
  building_id: Building['id'];
  level: number;
};

export type BuildingField = {
  // Resource building ids [1, 18]
  // Village building ids [19, 40]
  // Rally point (39) and wall (40) are always on the same spot, these spots can't be taken by other buildings, nor can a player build anything else here
  id: BuildingFieldModel['field_id'];
  buildingId: Building['id'];
  level: number;
};
