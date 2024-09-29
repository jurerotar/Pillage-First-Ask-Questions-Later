import type { Building } from 'interfaces/models/game/building';
import type { Unit } from 'interfaces/models/game/unit';
import type { BuildingField, Village } from 'interfaces/models/game/village';

export enum GameEventType {
  BUILDING_SCHEDULED_CONSTRUCTION = 'buildingScheduledConstruction',
  BUILDING_CONSTRUCTION = 'buildingConstruction',
  BUILDING_LEVEL_CHANGE = 'buildingLevelChange',
  BUILDING_DESTRUCTION = 'buildingDestruction',
  TROOP_TRAINING = 'troopTraining',
}

export type EventWithRequiredResourceCheck = {
  resourceCost: number[];
};

type BaseBuildingEventArgs = EventWithRequiredResourceCheck & {
  buildingFieldId: BuildingField['id'];
  building: Building;
  level: number;
};

type BuildingDestructionEventArgs = Omit<BaseBuildingEventArgs, 'level' | 'resourceCost'>;

type BaseUnitTrainingEventArgs = EventWithRequiredResourceCheck & {
  amount: number;
  unitId: Unit['id'];
  buildingId: Building['id'];
};

type GameEventTypeToEventArgsMap<T extends GameEventType> = {
  [GameEventType.BUILDING_SCHEDULED_CONSTRUCTION]: BaseBuildingEventArgs;
  [GameEventType.BUILDING_CONSTRUCTION]: BaseBuildingEventArgs;
  [GameEventType.BUILDING_LEVEL_CHANGE]: BaseBuildingEventArgs;
  [GameEventType.BUILDING_DESTRUCTION]: BuildingDestructionEventArgs;
  [GameEventType.TROOP_TRAINING]: BaseUnitTrainingEventArgs;
}[T];

// biome-ignore lint/suspicious/noConfusingVoidType: This type is super hacky. Need to figure out a solution.
export type GameEvent<T extends GameEventType | void = void> = {
  id: string;
  villageId: Village['id'];
  type: GameEventType;
  startsAt: number;
  duration: number;
  // @ts-expect-error - We need a generic GameEvent as well as more defined one
} & (T extends void ? object : GameEventTypeToEventArgsMap<T>);
