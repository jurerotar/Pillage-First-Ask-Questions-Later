import { createContext } from 'react';
import type { Building } from '@pillage-first/types/models/building';
import type { BuildingField } from '@pillage-first/types/models/building-field';
import type { Effect } from '@pillage-first/types/models/effect';

type BuildingFieldContextReturn = {
  buildingFieldId: BuildingField['id'];
  buildingField: BuildingField | null;
  doesBuildingExist: boolean;
  actualLevel: number;
  virtualLevel: number;
  isUpgrading: boolean;
  isDowngrading: boolean;
  maxLevelByBuildingId: Map<Building['id'], number>;
  buildingIdsInQueue: Set<Building['id']>;
  nextInstanceNumberByBuildingId: ReadonlyMap<Building['id'], number>;
  buildingDuration: number;
  serverEffectValueByEffectId: ReadonlyMap<Effect['id'], number>;
};

export const BuildingFieldContext = createContext<BuildingFieldContextReturn>(
  {} as never,
);
