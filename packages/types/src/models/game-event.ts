import { z } from 'zod';
import type { Building } from './building';
import type { BuildingField } from './building-field';
import type { Coordinates } from './coordinates';
import type { TroopTrainingDurationEffectId } from './effect';
import type { Troop } from './troop';
import type { Unit } from './unit';
import type { Village } from './village';

type BaseGameEvent = {
  id: number;
  type: GameEventType;
  startsAt: number;
  duration: number;
  resolvesAt: number;
  villageId: Village['id'] | null;
};

type GlobalGameEvent = Omit<BaseGameEvent, 'villageId'> & {
  villageId: null;
};

type VillageGameEvent = Omit<BaseGameEvent, 'villageId'> & {
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
  originCoordinates: Coordinates;
  targetCoordinates: Coordinates;
};

export type TroopMovementEventType = Extract<
  GameEventType,
  | 'troopMovementReinforcements'
  | 'troopMovementRelocation'
  | 'troopMovementReturn'
  | 'troopMovementFindNewVillage'
  | 'troopMovementAttack'
  | 'troopMovementRaid'
  | 'troopMovementOasisOccupation'
  | 'troopMovementAdventure'
>;

export type ReturnTroopMovementEvent = BaseTroopMovementEvent & {
  originalMovementType: TroopMovementEventType;
};

export const gameEventTypeSchema = z.enum([
  'buildingScheduledConstruction',
  'buildingConstruction',
  'buildingLevelChange',
  'buildingDestruction',
  'troopTraining',
  'troopMovementReinforcements',
  'troopMovementRelocation',
  'troopMovementReturn',
  'troopMovementFindNewVillage',
  'troopMovementAttack',
  'troopMovementRaid',
  'troopMovementOasisOccupation',
  'troopMovementAdventure',
  'unitResearch',
  'unitImprovement',
  'adventurePointIncrease',
  'heroRevival',
  'heroHealthRegeneration',
  'loyaltyIncrease',
]);

export type GameEventType = z.infer<typeof gameEventTypeSchema>;

export type GameEventTypeToEventArgsMap<T extends GameEventType> = {
  buildingScheduledConstruction: BuildingScheduledConstructionEvent &
    VillageGameEvent;
  buildingConstruction: BaseBuildingEvent & VillageGameEvent;
  buildingLevelChange: BuildingLevelChangeEvent & VillageGameEvent;
  buildingDestruction: BuildingDestructionEvent & VillageGameEvent;
  troopTraining: BaseUnitTrainingEvent & VillageGameEvent;
  unitResearch: UnitResearchEvent & VillageGameEvent;
  unitImprovement: UnitImprovementEvent & VillageGameEvent;
  troopMovementReinforcements: BaseTroopMovementEvent & VillageGameEvent;
  troopMovementRelocation: BaseTroopMovementEvent & VillageGameEvent;
  troopMovementReturn: ReturnTroopMovementEvent & VillageGameEvent;
  troopMovementFindNewVillage: BaseTroopMovementEvent & VillageGameEvent;
  troopMovementAttack: BaseTroopMovementEvent & VillageGameEvent;
  troopMovementRaid: BaseTroopMovementEvent & VillageGameEvent;
  troopMovementOasisOccupation: BaseTroopMovementEvent & VillageGameEvent;
  troopMovementAdventure: BaseTroopMovementEvent & VillageGameEvent;
  adventurePointIncrease: GlobalGameEvent;
  heroRevival: VillageGameEvent;
  heroHealthRegeneration: GlobalGameEvent;
  loyaltyIncrease: GlobalGameEvent;
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
    : Omit<BaseGameEvent, 'type' | 'villageId'> & {
        type: T;
        // @ts-expect-error - undefined is triggering the TS compiler even though we check for it, tsc is dumb
      } & GameEventTypeToEventArgsMap<T>;
