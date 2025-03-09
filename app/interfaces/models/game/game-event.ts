import type { Building } from 'app/interfaces/models/game/building';
import type { Unit } from 'app/interfaces/models/game/unit';
import type { BuildingField, Village } from 'app/interfaces/models/game/village';

type WithResourceCheck<T> = T & {
  resourceCost: number[];
};

type BaseGameEvent = {
  id: string;
  villageId: Village['id'];
  type: GameEventType;
  startsAt: number;
  duration: number;
};

type BaseBuildingEvent = WithResourceCheck<
  BaseGameEvent & {
    buildingFieldId: BuildingField['id'];
    building: Building;
    level: number;
  }
>;

type BuildingDestructionEvent = Omit<BaseBuildingEvent, 'level' | 'resourceCost'>;

type BaseUnitTrainingEvent = WithResourceCheck<
  BaseGameEvent & {
    amount: number;
    unitId: Unit['id'];
    buildingId: Building['id'];
  }
>;

export type GameEventType =
  | 'buildingScheduledConstruction'
  | 'buildingConstruction'
  | 'buildingLevelChange'
  | 'buildingDestruction'
  | 'troopTraining';

type GameEventTypeToEventArgsMap<T extends GameEventType> = {
  buildingScheduledConstruction: BaseBuildingEvent;
  buildingConstruction: BaseBuildingEvent;
  buildingLevelChange: BaseBuildingEvent;
  buildingDestruction: BuildingDestructionEvent;
  troopTraining: BaseUnitTrainingEvent;
}[T];

export type GameEvent<T extends GameEventType | undefined = undefined> = T extends undefined
  ? BaseGameEvent
  : // @ts-expect-error - undefined is triggering the TS compiler even though we check for it, tsc is dumb
    BaseGameEvent & GameEventTypeToEventArgsMap<T>;

export type WithResourceCheckEvent = WithResourceCheck<BaseGameEvent>;
