import { Server } from 'interfaces/models/game/server';
import { BuildingFieldId, Village } from 'interfaces/models/game/village';
import { Building } from 'interfaces/models/game/building';

export enum GameEventType {
  BUILDING_CONSTRUCTION = 'buildingConstruction',
  BUILDING_LEVEL_CHANGE = 'buildingLevelChange',
  BUILDING_DESTRUCTION = 'buildingDestruction',
}

export type BuildingConstructionEventArgs = {
  villageId: Village['id'];
  buildingFieldId: BuildingFieldId;
  buildingId: Building['id'];
}

export type BuildingLevelChangeEventArgs = {
  villageId: Village['id'];
  buildingFieldId: BuildingFieldId;
  level: number;
}

export type BuildingDestructionEventArgs = {
  villageId: Village['id'];
  buildingFieldId: BuildingFieldId;
}

type GameEventTypeToEventArgsMap<T extends GameEventType> = {
  [GameEventType.BUILDING_CONSTRUCTION]: BuildingConstructionEventArgs;
  [GameEventType.BUILDING_LEVEL_CHANGE]: BuildingLevelChangeEventArgs;
  [GameEventType.BUILDING_DESTRUCTION]: BuildingDestructionEventArgs;
}[T];

export type GameEvent<T extends GameEventType | void = void> = {
  id: string;
  serverId: Server['id'];
  type: GameEventType;
  resolvesAt: number;
  // @ts-expect-error - We need a generic GameEvent as well as more defined one
} & (T extends void ? object : GameEventTypeToEventArgsMap<T>);
