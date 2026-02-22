import type { Building } from './building';
import type { BuildingField } from './building-field';
import type { TroopTrainingDurationEffectId } from './effect';
import type { Troop } from './troop';
import type { Unit } from './unit';
import type { Village } from './village';
import { z } from 'zod';

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

export type TroopMovementType =
  | 'reinforcements'
  | 'relocation'
  | 'return'
  | 'find-new-village'
  | 'attack'
  | 'raid'
  | 'oasis-occupation'
  | 'adventure';

type BaseTroopMovementEvent = {
  troops: Troop[];
  targetId: Village['id'];
};

export type ReturnTroopMovementEvent = BaseTroopMovementEvent & {
  originalMovementType: TroopMovementType;
};

export const gameEventTypeSchema = z.enum([
  '__internal__seedOasisOccupiableByTable','buildingScheduledConstruction','buildingConstruction','buildingLevelChange','buildingDestruction','troopTraining','troopMovementReinforcements','troopMovementRelocation','troopMovementReturn','troopMovementFindNewVillage','troopMovementAttack','troopMovementRaid','troopMovementOasisOccupation','troopMovementAdventure','unitResearch','unitImprovement','adventurePointIncrease'
]);

export type GameEventType = z.infer<typeof gameEventTypeSchema>;

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
  troopMovementReinforcements: BaseTroopMovementEvent;
  troopMovementRelocation: BaseTroopMovementEvent;
  troopMovementReturn: ReturnTroopMovementEvent;
  troopMovementFindNewVillage: BaseTroopMovementEvent;
  troopMovementAttack: BaseTroopMovementEvent;
  troopMovementRaid: BaseTroopMovementEvent;
  troopMovementOasisOccupation: BaseTroopMovementEvent;
  troopMovementAdventure: BaseTroopMovementEvent;
  adventurePointIncrease: BaseGameEvent;
}[T];

export type TroopMovementEvent =
  | GameEvent<'troopMovementReinforcements'>
  | GameEvent<'troopMovementRelocation'>
  | GameEvent<'troopMovementReturn'>
  | GameEvent<'troopMovementFindNewVillage'>
  | GameEvent<'troopMovementAttack'>
  | GameEvent<'troopMovementRaid'>
  | GameEvent<'troopMovementOasisOccupation'>
  | GameEvent<'troopMovementAdventure'>;

export type BuildingEvent =
  | GameEvent<'buildingScheduledConstruction'>
  | GameEvent<'buildingLevelChange'>
  | GameEvent<'buildingConstruction'>;

export type GameEvent<T extends GameEventType | undefined = undefined> =
  T extends undefined
    ? BaseGameEvent
    : Omit<BaseGameEvent, 'type'> & {
        type: T;
        // @ts-expect-error - undefined is triggering the TS compiler even though we check for it, tsc is dumb
      } & GameEventTypeToEventArgsMap<T>;
