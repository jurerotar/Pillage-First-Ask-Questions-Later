import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getUnitsByTribeWithHero } from '@pillage-first/game-assets/utils/units';
import type { Tribe } from '@pillage-first/types/models/tribe';
import type { TroopLike } from '@pillage-first/types/models/troop';
import type { UnitId } from '@pillage-first/types/models/unit';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';

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

type CombatSimulatorAttackerVillage = {
  population: number;
};

type CombatSimulatorDefenderVillage = CombatSimulatorAttackerVillage & {
  wallLevel: number;
  residenceLevel: number;
};

type CombatSimulatorParticipant<TVillage> = {
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
  setAttackerTribe: (tribe: Tribe) => void;
  setDefenderTribe: (tribe: Tribe) => void;
  swapAttackerAndPrimaryDefender: () => void;
  setAttackerTroops: (troops: TroopLike[]) => void;
  setDefenderTroops: (troops: TroopLike[]) => void;
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
    troops: TroopLike[],
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

const DEFAULT_HERO_STATS = {
  hp: 100,
  strength: 0,
  attackBonus: 0,
  defenceBonus: 0,
  mounted: false,
} satisfies CombatSimulatorHeroStats;

const createEmptyTroops = (tribe: Tribe): CombatSimulatorTroop[] => {
  return getUnitsByTribeWithHero(tribe).map(({ id }) => ({
    unitId: id,
    amount: 0,
    smithyImprovementLevel: 0,
  }));
};

const clampInteger = (value: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, Math.trunc(value)));
};

const normalizeTroops = (troops: TroopLike[]): CombatSimulatorTroop[] => {
  return troops.map((troop) => ({
    ...troop,
    smithyImprovementLevel: clampInteger(
      typeof troop.smithyImprovementLevel === 'number'
        ? troop.smithyImprovementLevel
        : 0,
      0,
      20,
    ),
  }));
};

const setTroopSmithyImprovementLevel = (
  troops: CombatSimulatorTroop[],
  unitId: UnitId,
  smithyImprovementLevel: number,
): CombatSimulatorTroop[] => {
  return troops.map((troop) =>
    troop.unitId === unitId
      ? {
          ...troop,
          smithyImprovementLevel: clampInteger(smithyImprovementLevel, 0, 20),
        }
      : troop,
  );
};

const createParticipant = <TVillage,>(
  tribe: Tribe,
  village: TVillage,
): CombatSimulatorParticipant<TVillage> => {
  return {
    tribe,
    troops: createEmptyTroops(tribe),
    heroStats: { ...DEFAULT_HERO_STATS },
    village,
  };
};

const createInitialCombatSimulatorState = (
  initialTribe: Tribe,
): CombatSimulatorState => {
  return {
    attacker: createParticipant(initialTribe, { population: 100 }),
    defender: {
      ...createParticipant(initialTribe, {
        population: 100,
        wallLevel: 0,
        residenceLevel: 0,
      }),
      reinforcements: [],
    },
  };
};

export const CombatSimulatorProvider = ({ children }: PropsWithChildren) => {
  const initialTribe = useTribe();
  const nextReinforcementId = useRef(1);
  const [state, setState] = useState<CombatSimulatorState>(() =>
    createInitialCombatSimulatorState(initialTribe),
  );

  const setAttackerTribe = useCallback((tribe: Tribe) => {
    setState((prevState) => ({
      ...prevState,
      attacker: {
        ...prevState.attacker,
        tribe,
        troops: createEmptyTroops(tribe),
      },
    }));
  }, []);

  const setDefenderTribe = useCallback((tribe: Tribe) => {
    setState((prevState) => ({
      ...prevState,
      defender: {
        ...prevState.defender,
        tribe,
        troops: createEmptyTroops(tribe),
      },
    }));
  }, []);

  const swapAttackerAndPrimaryDefender = useCallback(() => {
    setState((prevState) => ({
      attacker: {
        tribe: prevState.defender.tribe,
        troops: prevState.defender.troops,
        heroStats: prevState.defender.heroStats,
        village: {
          population: prevState.defender.village.population,
        },
      },
      defender: {
        ...prevState.defender,
        tribe: prevState.attacker.tribe,
        troops: prevState.attacker.troops,
        heroStats: prevState.attacker.heroStats,
        village: {
          ...prevState.defender.village,
          population: prevState.attacker.village.population,
        },
      },
    }));
  }, []);

  const setAttackerTroops = useCallback((troops: TroopLike[]) => {
    setState((prevState) => ({
      ...prevState,
      attacker: { ...prevState.attacker, troops: normalizeTroops(troops) },
    }));
  }, []);

  const setDefenderTroops = useCallback((troops: TroopLike[]) => {
    setState((prevState) => ({
      ...prevState,
      defender: { ...prevState.defender, troops: normalizeTroops(troops) },
    }));
  }, []);

  const setAttackerSmithyImprovementLevel = useCallback(
    (unitId: UnitId, smithyImprovementLevel: number) => {
      setState((prevState) => ({
        ...prevState,
        attacker: {
          ...prevState.attacker,
          troops: setTroopSmithyImprovementLevel(
            prevState.attacker.troops,
            unitId,
            smithyImprovementLevel,
          ),
        },
      }));
    },
    [],
  );

  const setDefenderSmithyImprovementLevel = useCallback(
    (unitId: UnitId, smithyImprovementLevel: number) => {
      setState((prevState) => ({
        ...prevState,
        defender: {
          ...prevState.defender,
          troops: setTroopSmithyImprovementLevel(
            prevState.defender.troops,
            unitId,
            smithyImprovementLevel,
          ),
        },
      }));
    },
    [],
  );

  const setAttackerHeroStats = useCallback(
    (heroStats: CombatSimulatorHeroStats) => {
      setState((prevState) => ({
        ...prevState,
        attacker: { ...prevState.attacker, heroStats },
      }));
    },
    [],
  );

  const setDefenderHeroStats = useCallback(
    (heroStats: CombatSimulatorHeroStats) => {
      setState((prevState) => ({
        ...prevState,
        defender: { ...prevState.defender, heroStats },
      }));
    },
    [],
  );

  const setAttackerVillagePopulation = useCallback((population: number) => {
    setState((prevState) => ({
      ...prevState,
      attacker: {
        ...prevState.attacker,
        village: {
          ...prevState.attacker.village,
          population: Math.max(0, Math.trunc(population)),
        },
      },
    }));
  }, []);

  const setDefenderVillagePopulation = useCallback((population: number) => {
    setState((prevState) => ({
      ...prevState,
      defender: {
        ...prevState.defender,
        village: {
          ...prevState.defender.village,
          population: Math.max(0, Math.trunc(population)),
        },
      },
    }));
  }, []);

  const setDefenderWallLevel = useCallback((wallLevel: number) => {
    setState((prevState) => ({
      ...prevState,
      defender: {
        ...prevState.defender,
        village: {
          ...prevState.defender.village,
          wallLevel: clampInteger(wallLevel, 0, 20),
        },
      },
    }));
  }, []);

  const setDefenderResidenceLevel = useCallback((residenceLevel: number) => {
    setState((prevState) => ({
      ...prevState,
      defender: {
        ...prevState.defender,
        village: {
          ...prevState.defender.village,
          residenceLevel: clampInteger(residenceLevel, 0, 20),
        },
      },
    }));
  }, []);

  const clearAttackerData = useCallback(() => {
    setState((prevState) => ({
      ...prevState,
      attacker: createParticipant(prevState.attacker.tribe, {
        population: 100,
      }),
    }));
  }, []);

  const clearDefenderData = useCallback(() => {
    setState((prevState) => ({
      ...prevState,
      defender: {
        ...prevState.defender,
        ...createParticipant(prevState.defender.tribe, {
          population: 100,
          wallLevel: 0,
          residenceLevel: 0,
        }),
      },
    }));
  }, []);

  const clearParticipantData = useCallback(
    (participant: CombatSimulatorParticipantReference) => {
      setState((prevState) => {
        if (participant.role === 'attacker') {
          return {
            ...prevState,
            attacker: createParticipant(prevState.attacker.tribe, {
              population: 100,
            }),
          };
        }

        if (participant.role === 'defender') {
          return {
            ...prevState,
            defender: {
              ...prevState.defender,
              ...createParticipant(prevState.defender.tribe, {
                population: 100,
                wallLevel: 0,
                residenceLevel: 0,
              }),
            },
          };
        }

        return {
          ...prevState,
          defender: {
            ...prevState.defender,
            reinforcements: prevState.defender.reinforcements.map(
              (reinforcement) =>
                reinforcement.id === participant.reinforcementId
                  ? {
                      id: reinforcement.id,
                      ...createParticipant(reinforcement.tribe, {
                        population: 100,
                      }),
                    }
                  : reinforcement,
            ),
          },
        };
      });
    },
    [],
  );

  const addDefenderReinforcement = useCallback(
    (tribe: Tribe = initialTribe) => {
      const id = `reinforcement-${nextReinforcementId.current}`;
      nextReinforcementId.current += 1;

      setState((prevState) => ({
        ...prevState,
        defender: {
          ...prevState.defender,
          reinforcements: [
            ...prevState.defender.reinforcements,
            {
              id,
              ...createParticipant(tribe, { population: 100 }),
            },
          ],
        },
      }));
    },
    [initialTribe],
  );

  const removeDefenderReinforcement = useCallback(
    (reinforcementId: CombatSimulatorReinforcement['id']) => {
      setState((prevState) => ({
        ...prevState,
        defender: {
          ...prevState.defender,
          reinforcements: prevState.defender.reinforcements.filter(
            ({ id }) => id !== reinforcementId,
          ),
        },
      }));
    },
    [],
  );

  const removeParticipant = useCallback(
    (participant: CombatSimulatorRemovableParticipantReference) => {
      setState((prevState) => ({
        ...prevState,
        defender: {
          ...prevState.defender,
          reinforcements: prevState.defender.reinforcements.filter(
            ({ id }) => id !== participant.reinforcementId,
          ),
        },
      }));
    },
    [],
  );

  const setDefenderReinforcementTribe = useCallback(
    (reinforcementId: CombatSimulatorReinforcement['id'], tribe: Tribe) => {
      setState((prevState) => ({
        ...prevState,
        defender: {
          ...prevState.defender,
          reinforcements: prevState.defender.reinforcements.map(
            (reinforcement) => {
              if (reinforcement.id !== reinforcementId) {
                return reinforcement;
              }

              return {
                ...reinforcement,
                tribe,
                troops: createEmptyTroops(tribe),
              };
            },
          ),
        },
      }));
    },
    [],
  );

  const setDefenderReinforcementTroops = useCallback(
    (
      reinforcementId: CombatSimulatorReinforcement['id'],
      troops: TroopLike[],
    ) => {
      setState((prevState) => ({
        ...prevState,
        defender: {
          ...prevState.defender,
          reinforcements: prevState.defender.reinforcements.map(
            (reinforcement) =>
              reinforcement.id === reinforcementId
                ? { ...reinforcement, troops: normalizeTroops(troops) }
                : reinforcement,
          ),
        },
      }));
    },
    [],
  );

  const setDefenderReinforcementSmithyImprovementLevel = useCallback(
    (
      reinforcementId: CombatSimulatorReinforcement['id'],
      unitId: UnitId,
      smithyImprovementLevel: number,
    ) => {
      setState((prevState) => ({
        ...prevState,
        defender: {
          ...prevState.defender,
          reinforcements: prevState.defender.reinforcements.map(
            (reinforcement) =>
              reinforcement.id === reinforcementId
                ? {
                    ...reinforcement,
                    troops: setTroopSmithyImprovementLevel(
                      reinforcement.troops,
                      unitId,
                      smithyImprovementLevel,
                    ),
                  }
                : reinforcement,
          ),
        },
      }));
    },
    [],
  );

  const setDefenderReinforcementHeroStats = useCallback(
    (
      reinforcementId: CombatSimulatorReinforcement['id'],
      heroStats: CombatSimulatorHeroStats,
    ) => {
      setState((prevState) => ({
        ...prevState,
        defender: {
          ...prevState.defender,
          reinforcements: prevState.defender.reinforcements.map(
            (reinforcement) =>
              reinforcement.id === reinforcementId
                ? { ...reinforcement, heroStats }
                : reinforcement,
          ),
        },
      }));
    },
    [],
  );

  const setDefenderReinforcementVillagePopulation = useCallback(
    (
      reinforcementId: CombatSimulatorReinforcement['id'],
      population: number,
    ) => {
      setState((prevState) => ({
        ...prevState,
        defender: {
          ...prevState.defender,
          reinforcements: prevState.defender.reinforcements.map(
            (reinforcement) =>
              reinforcement.id === reinforcementId
                ? {
                    ...reinforcement,
                    village: {
                      ...reinforcement.village,
                      population: Math.max(0, Math.trunc(population)),
                    },
                  }
                : reinforcement,
          ),
        },
      }));
    },
    [],
  );

  const clearDefenderReinforcementData = useCallback(
    (reinforcementId: CombatSimulatorReinforcement['id']) => {
      setState((prevState) => ({
        ...prevState,
        defender: {
          ...prevState.defender,
          reinforcements: prevState.defender.reinforcements.map(
            (reinforcement) =>
              reinforcement.id === reinforcementId
                ? {
                    id: reinforcement.id,
                    ...createParticipant(reinforcement.tribe, {
                      population: 100,
                    }),
                  }
                : reinforcement,
          ),
        },
      }));
    },
    [],
  );

  const value = useMemo(
    () => ({
      state,
      setAttackerTribe,
      setDefenderTribe,
      swapAttackerAndPrimaryDefender,
      setAttackerTroops,
      setDefenderTroops,
      setAttackerSmithyImprovementLevel,
      setDefenderSmithyImprovementLevel,
      setAttackerHeroStats,
      setDefenderHeroStats,
      setAttackerVillagePopulation,
      setDefenderVillagePopulation,
      setDefenderWallLevel,
      setDefenderResidenceLevel,
      clearAttackerData,
      clearDefenderData,
      clearParticipantData,
      addDefenderReinforcement,
      removeParticipant,
      removeDefenderReinforcement,
      setDefenderReinforcementTribe,
      setDefenderReinforcementTroops,
      setDefenderReinforcementSmithyImprovementLevel,
      setDefenderReinforcementHeroStats,
      setDefenderReinforcementVillagePopulation,
      clearDefenderReinforcementData,
    }),
    [
      state,
      setAttackerTribe,
      setDefenderTribe,
      swapAttackerAndPrimaryDefender,
      setAttackerTroops,
      setDefenderTroops,
      setAttackerSmithyImprovementLevel,
      setDefenderSmithyImprovementLevel,
      setAttackerHeroStats,
      setDefenderHeroStats,
      setAttackerVillagePopulation,
      setDefenderVillagePopulation,
      setDefenderWallLevel,
      setDefenderResidenceLevel,
      clearAttackerData,
      clearDefenderData,
      clearParticipantData,
      addDefenderReinforcement,
      removeParticipant,
      removeDefenderReinforcement,
      setDefenderReinforcementTribe,
      setDefenderReinforcementTroops,
      setDefenderReinforcementSmithyImprovementLevel,
      setDefenderReinforcementHeroStats,
      setDefenderReinforcementVillagePopulation,
      clearDefenderReinforcementData,
    ],
  );

  return (
    <CombatSimulatorContext value={value}>{children}</CombatSimulatorContext>
  );
};
