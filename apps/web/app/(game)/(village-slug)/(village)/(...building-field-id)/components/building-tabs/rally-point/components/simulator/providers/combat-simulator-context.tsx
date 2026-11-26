import { createContext } from 'react';
import type {
  CombatMode,
  CombatTroop,
} from '@pillage-first/types/models/combat';
import type { PlayableTribe, Tribe } from '@pillage-first/types/models/tribe';
import type { UnitId } from '@pillage-first/types/models/unit';
import type {
  CombatSimulatorFormReinforcement,
  CombatSimulatorFormState,
  CombatSimulatorHeroFormValues,
} from '../utils/combat-simulator-form';

export type CombatSimulatorContextValue = {
  state: CombatSimulatorFormState;
  setCombatMode: (combatMode: CombatMode) => void;
  swapPlayerRole: () => void;
  setAttackerTribe: (tribe: PlayableTribe) => void;
  setDefenderTribe: (tribe: Tribe) => void;
  setAttackerTroops: (troops: CombatTroop[]) => void;
  setDefenderTroops: (troops: CombatTroop[]) => void;
  setAttackerSmithyImprovementLevel: (
    unitId: UnitId,
    smithyImprovementLevel: number,
  ) => void;
  setDefenderSmithyImprovementLevel: (
    unitId: UnitId,
    smithyImprovementLevel: number,
  ) => void;
  setAttackerHeroStats: (heroStats: CombatSimulatorHeroFormValues) => void;
  setDefenderHeroStats: (heroStats: CombatSimulatorHeroFormValues) => void;
  setAttackerBreweryLevel: (breweryLevel: number) => void;
  setDefenderWallLevel: (wallLevel: number) => void;
  setDefenderResidenceLevel: (residenceLevel: number) => void;
  setDefenderTrapCount: (trapCount: number) => void;
  clearAttackerData: () => void;
  clearDefenderData: () => void;
  addDefenderReinforcement: (tribe?: Tribe) => void;
  removeDefenderReinforcement: (
    reinforcementId: CombatSimulatorFormReinforcement['id'],
  ) => void;
  setDefenderReinforcementTribe: (
    reinforcementId: CombatSimulatorFormReinforcement['id'],
    tribe: Tribe,
  ) => void;
  setDefenderReinforcementTroops: (
    reinforcementId: CombatSimulatorFormReinforcement['id'],
    troops: CombatTroop[],
  ) => void;
  setDefenderReinforcementSmithyImprovementLevel: (
    reinforcementId: CombatSimulatorFormReinforcement['id'],
    unitId: UnitId,
    smithyImprovementLevel: number,
  ) => void;
  clearDefenderReinforcementData: (
    reinforcementId: CombatSimulatorFormReinforcement['id'],
  ) => void;
};

export const CombatSimulatorContext =
  createContext<CombatSimulatorContextValue | null>(null);
