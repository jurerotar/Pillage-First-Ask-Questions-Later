import { createContext } from 'react';
import type {
  HeroItem,
  HeroItemSlot,
} from '@pillage-first/types/models/hero-item';
import type { PlayableTribe, Tribe } from '@pillage-first/types/models/tribe';
import type { TroopLike } from '@pillage-first/types/models/troop';
import type { UnitId } from '@pillage-first/types/models/unit';

export type CombatSimulatorHeroItemSlot = Extract<
  HeroItemSlot,
  'right-hand' | 'left-hand' | 'torso'
>;

export type CombatSimulatorHeroStats = {
  hp: number;
  strength: number;
  attackBonus: number;
  defenceBonus: number;
  mounted: boolean;
  itemIdsBySlot: Partial<Record<CombatSimulatorHeroItemSlot, HeroItem['id']>>;
};

export type CombatSimulatorTroop = TroopLike & {
  smithyImprovementLevel: number;
};

export type CombatSimulatorMode = 'attack' | 'raid';
export type CombatSimulatorPlayerRole = 'attacker' | 'defender';

export type CombatSimulatorAttackerVillage = {
  breweryLevel: number;
};

export type CombatSimulatorDefenderVillage = {
  wallLevel: number;
  residenceLevel: number;
  trapCount: number;
};

export type CombatSimulatorParticipant<TVillage> = {
  tribe: Tribe;
  troops: CombatSimulatorTroop[];
  heroStats: CombatSimulatorHeroStats;
  village: TVillage;
};

export type CombatSimulatorAttacker =
  CombatSimulatorParticipant<CombatSimulatorAttackerVillage>;

export type CombatSimulatorReinforcement = Omit<
  CombatSimulatorParticipant<undefined>,
  'heroStats'
> & {
  id: string;
};

export type CombatSimulatorDefender =
  CombatSimulatorParticipant<CombatSimulatorDefenderVillage> & {
    reinforcements: CombatSimulatorReinforcement[];
  };

export type CombatSimulatorState = {
  combatMode: CombatSimulatorMode;
  playerRole: CombatSimulatorPlayerRole;
  attacker: CombatSimulatorAttacker;
  defender: CombatSimulatorDefender;
};

export type CombatSimulatorContextValue = {
  state: CombatSimulatorState;
  setCombatMode: (combatMode: CombatSimulatorMode) => void;
  swapPlayerRole: () => void;
  setAttackerTribe: (tribe: PlayableTribe) => void;
  setDefenderTribe: (tribe: Tribe) => void;
  setAttackerTroops: (troops: CombatSimulatorTroop[]) => void;
  setDefenderTroops: (troops: CombatSimulatorTroop[]) => void;
  setAttackerSmithyImprovementLevel: (
    unitId: UnitId,
    smithyImprovementLevel: number,
  ) => void;
  setDefenderSmithyImprovementLevel: (
    unitId: UnitId,
    smithyImprovementLevel: number,
  ) => void;
  setAttackerHeroStats: (heroStats: CombatSimulatorHeroStats) => void;
  setDefenderHeroStats: (heroStats: CombatSimulatorHeroStats) => void;
  setAttackerBreweryLevel: (breweryLevel: number) => void;
  setDefenderWallLevel: (wallLevel: number) => void;
  setDefenderResidenceLevel: (residenceLevel: number) => void;
  setDefenderTrapCount: (trapCount: number) => void;
  clearAttackerData: () => void;
  clearDefenderData: () => void;
  addDefenderReinforcement: (tribe?: Tribe) => void;
  removeDefenderReinforcement: (
    reinforcementId: CombatSimulatorReinforcement['id'],
  ) => void;
  setDefenderReinforcementTribe: (
    reinforcementId: CombatSimulatorReinforcement['id'],
    tribe: Tribe,
  ) => void;
  setDefenderReinforcementTroops: (
    reinforcementId: CombatSimulatorReinforcement['id'],
    troops: CombatSimulatorTroop[],
  ) => void;
  setDefenderReinforcementSmithyImprovementLevel: (
    reinforcementId: CombatSimulatorReinforcement['id'],
    unitId: UnitId,
    smithyImprovementLevel: number,
  ) => void;
  clearDefenderReinforcementData: (
    reinforcementId: CombatSimulatorReinforcement['id'],
  ) => void;
};

export const CombatSimulatorContext =
  createContext<CombatSimulatorContextValue | null>(null);
