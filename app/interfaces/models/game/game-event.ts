import type { Building } from 'app/interfaces/models/game/building';
import type { Unit } from 'app/interfaces/models/game/unit';
import type { BuildingField, Village } from 'app/interfaces/models/game/village';

type WithResourceCheck<T> = T & {
  resourceCost: number[];
};

type WithVillageId<T> = T & {
  villageId: Village['id'];
};

type BaseGameEvent = {
  id: string;
  type: GameEventType;
  startsAt: number;
  duration: number;
};

type BaseBuildingEvent = WithResourceCheck<
  BaseGameEvent &
    WithVillageId<{
      buildingFieldId: BuildingField['id'];
      building: Building;
      level: number;
    }>
>;

type BuildingDestructionEvent = Omit<BaseBuildingEvent, 'level' | 'resourceCost'>;

type BaseUnitTrainingEvent = WithResourceCheck<
  BaseGameEvent &
    WithVillageId<{
      amount: number;
      unitId: Unit['id'];
      buildingId: Building['id'];
    }>
>;

export type GameEventType =
  | 'buildingScheduledConstruction'
  | 'buildingConstruction'
  | 'buildingLevelChange'
  | 'buildingDestruction'
  | 'troopTraining'
  | 'adventurePointIncrease';

type GameEventTypeToEventArgsMap<T extends GameEventType> = {
  buildingScheduledConstruction: BaseBuildingEvent;
  buildingConstruction: BaseBuildingEvent;
  buildingLevelChange: BaseBuildingEvent;
  buildingDestruction: BuildingDestructionEvent;
  troopTraining: BaseUnitTrainingEvent;
  adventurePointIncrease: BaseGameEvent;
}[T];

export type GameEvent<T extends GameEventType | undefined = undefined> = T extends undefined
  ? BaseGameEvent
  : // @ts-expect-error - undefined is triggering the TS compiler even though we check for it, tsc is dumb
    BaseGameEvent & GameEventTypeToEventArgsMap<T>;

export type WithResourceCheckEvent = WithResourceCheck<BaseGameEvent>;
export type WithVillageIdEvent = WithVillageId<BaseGameEvent>;
