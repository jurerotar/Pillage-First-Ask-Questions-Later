import type { Building } from 'app/interfaces/models/game/building';
import type { Unit } from 'app/interfaces/models/game/unit';
import type { BuildingField, Village } from 'app/interfaces/models/game/village';
import type { Troop } from 'app/interfaces/models/game/troop';

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
  cachesToClearOnResolve: string[];
};

type BaseBuildingEvent = WithVillageId<{
  buildingFieldId: BuildingField['id'];
  buildingId: Building['id'];
  level: number;
}>;

type BuildingLevelChangeEvent = WithResourceCheck<BaseBuildingEvent>;
type BuildingScheduledConstructionEvent = WithResourceCheck<BaseBuildingEvent>;

type BuildingDestructionEvent = Omit<BaseBuildingEvent, 'level'>;

type UnitResearchEvent = WithResourceCheck<
  WithVillageId<{
    unitId: Unit['id'];
  }>
>;

type UnitImprovementEvent = WithResourceCheck<
  WithVillageId<{
    unitId: Unit['id'];
    level: number;
  }>
>;

type BaseUnitTrainingEvent = WithResourceCheck<
  WithVillageId<{
    batchId: string;
    amount: number;
    unitId: Unit['id'];
    buildingId: Building['id'];
    resourceCost: number[];
  }>
>;

type BaseTroopMovementEvent = WithVillageId<{
  troops: Troop[];
  targetId: Village['id'];
}>;

type TroopMovementEvent = BaseTroopMovementEvent & {
  movementType: 'reinforcements' | 'relocation' | 'return' | 'find-new-village' | 'attack' | 'raid' | 'oasis-occupation' | 'adventure';
};

export type GameEventType =
  | 'buildingScheduledConstruction'
  | 'buildingConstruction'
  | 'buildingLevelChange'
  | 'buildingDestruction'
  | 'troopTraining'
  | 'troopMovement'
  | 'unitResearch'
  | 'unitImprovement'
  | 'adventurePointIncrease';

export type GameEventTypeToEventArgsMap<T extends GameEventType> = {
  buildingScheduledConstruction: BuildingScheduledConstructionEvent;
  buildingConstruction: BaseBuildingEvent;
  buildingLevelChange: BuildingLevelChangeEvent;
  buildingDestruction: BuildingDestructionEvent;
  troopTraining: BaseUnitTrainingEvent;
  unitResearch: UnitResearchEvent;
  unitImprovement: UnitImprovementEvent;
  troopMovement: TroopMovementEvent;
  adventurePointIncrease: BaseGameEvent;
}[T];

export type GameEvent<T extends GameEventType | undefined = undefined> = T extends undefined
  ? BaseGameEvent
  : // @ts-expect-error - undefined is triggering the TS compiler even though we check for it, tsc is dumb
    BaseGameEvent & GameEventTypeToEventArgsMap<T>;

export type WithResourceCheckEvent = WithResourceCheck<BaseGameEvent>;
export type WithVillageIdEvent = WithVillageId<BaseGameEvent>;
