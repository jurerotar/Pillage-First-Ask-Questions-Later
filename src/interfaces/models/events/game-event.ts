import type { Building } from 'interfaces/models/game/building';
import type { Server } from 'interfaces/models/game/server';
import type { BuildingField, Village } from 'interfaces/models/game/village';

export enum GameEventType {
  BUILDING_CONSTRUCTION = 'buildingConstruction',
  BUILDING_LEVEL_CHANGE = 'buildingLevelChange',
  BUILDING_DESTRUCTION = 'buildingDestruction',
}

export type EventWithRequiredResourceCheck = {
  resourceCost: number[];
};

export type BuildingConstructionEventArgs = EventWithRequiredResourceCheck & {
  buildingFieldId: BuildingField['id'];
  building: Building;
};

export type BuildingLevelChangeEventArgs = EventWithRequiredResourceCheck & {
  building: Building;
  buildingFieldId: BuildingField['id'];
  level: number;
};

export type BuildingDestructionEventArgs = {
  buildingFieldId: BuildingField['id'];
  building: Building;
};

type GameEventTypeToEventArgsMap<T extends GameEventType> = {
  [GameEventType.BUILDING_CONSTRUCTION]: BuildingConstructionEventArgs;
  [GameEventType.BUILDING_LEVEL_CHANGE]: BuildingLevelChangeEventArgs;
  [GameEventType.BUILDING_DESTRUCTION]: BuildingDestructionEventArgs;
}[T];

// biome-ignore lint/suspicious/noConfusingVoidType: This type is super hacky. Need to figure out a solution.
export type GameEvent<T extends GameEventType | void = void> = {
  id: string;
  serverId: Server['id'];
  villageId: Village['id'];
  type: GameEventType;
  resolvesAt: number;
  // @ts-expect-error - We need a generic GameEvent as well as more defined one
} & (T extends void ? object : GameEventTypeToEventArgsMap<T>);
