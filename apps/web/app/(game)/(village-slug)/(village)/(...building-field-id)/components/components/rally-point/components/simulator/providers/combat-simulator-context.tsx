import { createContext } from 'react';
import type { Tribe } from '@pillage-first/types/models/tribe';
import type { TroopLike } from '@pillage-first/types/models/troop';
import type { UnitId } from '@pillage-first/types/models/unit';

export type CombatSimulatorHeroStats = {
  hp: number;
  strength: number;
  attackBonus: number;
  defenceBonus: number;
  mounted: boolean;
};

export type CombatSimulatorTroop = TroopLike & {
  smithyImprovementLevel: number;
};

export type CombatSimulatorMode = 'attack' | 'raid';

export type CombatSimulatorAttackerVillage = {
  population: number;
};

export type CombatSimulatorDefenderVillage = CombatSimulatorAttackerVillage & {
  wallLevel: number;
  residenceLevel: number;
};

export type CombatSimulatorParticipant<TVillage> = {
  tribe: Tribe;
  troops: CombatSimulatorTroop[];
  heroStats: CombatSimulatorHeroStats;
  village: TVillage;
};

export type CombatSimulatorAttacker =
  CombatSimulatorParticipant<CombatSimulatorAttackerVillage>;

export type CombatSimulatorReinforcement =
  CombatSimulatorParticipant<CombatSimulatorAttackerVillage> & {
    id: string;
  };

export type CombatSimulatorDefender =
  CombatSimulatorParticipant<CombatSimulatorDefenderVillage> & {
    reinforcements: CombatSimulatorReinforcement[];
  };

export type CombatSimulatorState = {
  combatMode: CombatSimulatorMode;
  attacker: CombatSimulatorAttacker;
  defender: CombatSimulatorDefender;
};

export type CombatSimulatorParticipantReference =
  | { role: 'attacker' }
  | { role: 'defender' }
  | {
      role: 'reinforcement';
      reinforcementId: CombatSimulatorReinforcement['id'];
    };

export type CombatSimulatorRemovableParticipantReference = Extract<
  CombatSimulatorParticipantReference,
  { role: 'reinforcement' }
>;

export type CombatSimulatorContextValue = {
  state: CombatSimulatorState;
  setCombatMode: (combatMode: CombatSimulatorMode) => void;
  setAttackerTribe: (tribe: Tribe) => void;
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
  setAttackerVillagePopulation: (population: number) => void;
  setDefenderVillagePopulation: (population: number) => void;
  setDefenderWallLevel: (wallLevel: number) => void;
  setDefenderResidenceLevel: (residenceLevel: number) => void;
  clearAttackerData: () => void;
  clearDefenderData: () => void;
  clearParticipantData: (
    participant: CombatSimulatorParticipantReference,
  ) => void;
  addDefenderReinforcement: (tribe?: Tribe) => void;
  removeParticipant: (
    participant: CombatSimulatorRemovableParticipantReference,
  ) => void;
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
  setDefenderReinforcementHeroStats: (
    reinforcementId: CombatSimulatorReinforcement['id'],
    heroStats: CombatSimulatorHeroStats,
  ) => void;
  setDefenderReinforcementVillagePopulation: (
    reinforcementId: CombatSimulatorReinforcement['id'],
    population: number,
  ) => void;
  clearDefenderReinforcementData: (
    reinforcementId: CombatSimulatorReinforcement['id'],
  ) => void;
};

export const CombatSimulatorContext =
  createContext<CombatSimulatorContextValue | null>(null);
