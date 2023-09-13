import { Point } from 'interfaces/models/common';
import { Resource, Resources } from 'interfaces/models/game/resource';
import { Building } from 'interfaces/models/game/building';

export type ResourceFieldId =
  '1'
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

export type ResourceField = {
  type: Resource;
  level: number;
};

export type ResourceFieldType =
  '4446'
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

export type ResourceFieldLayout = {
  [key in ResourceFieldId]: Resource;
};

export type ResourceFieldLayoutByFieldType = {
  [key in ResourceFieldType]: ResourceFieldLayout;
};

export type ResourceFields = {
  [key in ResourceFieldId]: ResourceField | null;
};

export type BuildingFieldId =
  '1'
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
  | '18'
  | '19'
  | '20';

export type BuildingField = {
  buildingId: Building['id'];
  level: number;
};

export type BuildingFields = {
  [key in BuildingFieldId]: BuildingField | null;
};

export type Village = {
  id: string;
  name: string;
  slug: string;
  lastUpdatedAt: number;
  position: Point;
  resources: Resources;
  storageCapacity: Resources;
  hourlyProduction: Resources;
  resourceFields: ResourceFields;
  buildingFields: BuildingFields;
  isCapital: boolean;
  ownedBy: number;
};
