import type { Building } from 'app/interfaces/models/game/building';
import type { Unit } from 'app/interfaces/models/game/unit';
import type { BuildingField, Village } from 'app/interfaces/models/game/village';
import type { Troop } from 'app/interfaces/models/game/troop';
import type { Tile } from 'app/interfaces/models/game/tile';

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
  WithVillageId<{
    buildingFieldId: BuildingField['id'];
    buildingId: Building['id'];
    level: number;
  }>
>;

type BuildingDestructionEvent = Omit<BaseBuildingEvent, 'level' | 'resourceCost'>;

type BaseUnitTrainingEvent = WithResourceCheck<
  WithVillageId<{
    amount: number;
    unitId: Unit['id'];
    buildingId: Building['id'];
  }>
>;

type BaseTroopMovementEvent = WithVillageId<{
  troops: Troop[];
  targetId: Village['id'];
}>;

type TroopMovementEvent = BaseTroopMovementEvent & {
  movementType: 'reinforcements' | 'relocation' | 'return';
};

type OffensiveTroopMovementEvent = BaseTroopMovementEvent & {
  movementType: 'attack' | 'raid';
};

type OasisOccupationTroopMovementEvent = BaseTroopMovementEvent & {
  movementType: 'oasis-occupation';
};

type FindNewVillageEvent = WithVillageId<{
  targetTileId: Tile['id'];
}>;

export type GameEventType =
  | 'buildingScheduledConstruction'
  | 'buildingConstruction'
  | 'buildingLevelChange'
  | 'buildingDestruction'
  | 'troopTraining'
  | 'troopMovement'
  | 'oasisOccupation'
  | 'offensiveTroopMovement'
  | 'findNewVillage'
  | 'adventurePointIncrease';

type GameEventTypeToEventArgsMap<T extends GameEventType> = {
  buildingScheduledConstruction: BaseBuildingEvent;
  buildingConstruction: BaseBuildingEvent;
  buildingLevelChange: BaseBuildingEvent;
  buildingDestruction: BuildingDestructionEvent;
  troopTraining: BaseUnitTrainingEvent;
  troopMovement: TroopMovementEvent;
  oasisOccupation: OasisOccupationTroopMovementEvent;
  offensiveTroopMovement: OffensiveTroopMovementEvent;
  findNewVillage: FindNewVillageEvent;
  adventurePointIncrease: BaseGameEvent;
}[T];

export type GameEvent<T extends GameEventType | undefined = undefined> = T extends undefined
  ? BaseGameEvent
  : // @ts-expect-error - undefined is triggering the TS compiler even though we check for it, tsc is dumb
    BaseGameEvent & GameEventTypeToEventArgsMap<T>;

export type WithResourceCheckEvent = WithResourceCheck<BaseGameEvent>;
export type WithVillageIdEvent = WithVillageId<BaseGameEvent>;
