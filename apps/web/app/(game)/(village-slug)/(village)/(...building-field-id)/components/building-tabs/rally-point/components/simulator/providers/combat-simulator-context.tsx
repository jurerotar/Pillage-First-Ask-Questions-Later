import { createContext } from 'react';
import type {
  CombatSimulatorHeroStats,
  CombatSimulatorMode,
  CombatSimulatorReinforcement,
  CombatSimulatorState,
  CombatSimulatorTroop,
} from '@pillage-first/types/models/combat-simulator';
import type { PlayableTribe, Tribe } from '@pillage-first/types/models/tribe';
import type { UnitId } from '@pillage-first/types/models/unit';

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
