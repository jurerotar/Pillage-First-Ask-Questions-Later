import { createContext } from 'react';
import type { Building } from '@pillage-first/types/models/building';
import type { BuildingField } from '@pillage-first/types/models/building-field';

type BuildingFieldContextReturn = {
  buildingFieldId: BuildingField['id'];
  buildingField: BuildingField | null;
  maxLevelByBuildingId: Map<Building['id'], number>;
  buildingIdsInQueue: Set<Building['id']>;
};

export const BuildingFieldContext = createContext<BuildingFieldContextReturn>(
  {} as never,
);
