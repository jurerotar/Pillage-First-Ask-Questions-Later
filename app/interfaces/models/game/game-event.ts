import type { Building } from 'app/interfaces/models/game/building';
import type { BuildingField } from 'app/interfaces/models/game/building-field';
import type { TroopTrainingDurationEffectId } from 'app/interfaces/models/game/effect';
import type { Troop } from 'app/interfaces/models/game/troop';
import type { Unit } from 'app/interfaces/models/game/unit';
import type { Village } from 'app/interfaces/models/game/village';

type BaseGameEvent = {
  id: number;
  type: GameEventType;
  startsAt: number;
  duration: number;
  resolvesAt: number;
  // This type is essentially a lie. `villageId` can be either a number or null, but we have a ton of type issues if we type it as such.
  // We just need to careful in global event resolvers to not use village id!
  villageId: Village['id'];
};

type BaseBuildingEvent = {
  buildingFieldId: BuildingField['id'];
  buildingId: Building['id'];
  level: number;
  previousLevel: number;
};

type BuildingLevelChangeEvent = BaseBuildingEvent;
type BuildingScheduledConstructionEvent = BaseBuildingEvent;

type BuildingDestructionEvent = Omit<BaseBuildingEvent, 'level'>;

type UnitResearchEvent = {
  unitId: Unit['id'];
};

type UnitImprovementEvent = {
  unitId: Unit['id'];
  level: number;
};

type BaseUnitTrainingEvent = {
  batchId: string;
  amount: number;
  unitId: Unit['id'];
  durationEffectId: TroopTrainingDurationEffectId;
  buildingId: Building['id'];
};

type BaseTroopMovementEvent = {
  troops: Troop[];
  targetId: Village['id'];
};

type TroopMovementEvent = BaseTroopMovementEvent & {
  movementType:
    | 'reinforcements'
    | 'relocation'
    | 'return'
    | 'find-new-village'
    | 'attack'
    | 'raid'
    | 'oasis-occupation'
    | 'adventure';
};

export type GameEventType =
  | '__internal__seedOasisOccupiableByTable'
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
  // This is an internal-only event that seeds oasis_occupiable_by table, so we don't have to do it on server creation
  __internal__seedOasisOccupiableByTable: BaseGameEvent;
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

export type GameEvent<T extends GameEventType | undefined = undefined> =
  T extends undefined
    ? BaseGameEvent
    : // @ts-expect-error - undefined is triggering the TS compiler even though we check for it, tsc is dumb
      BaseGameEvent & GameEventTypeToEventArgsMap<T>;
