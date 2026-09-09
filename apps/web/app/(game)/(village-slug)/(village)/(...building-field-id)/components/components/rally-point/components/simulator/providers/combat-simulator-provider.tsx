import {
  type PropsWithChildren,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getUnitsByTribeWithHero } from '@pillage-first/game-assets/utils/units';
import type { Tribe } from '@pillage-first/types/models/tribe';
import type { UnitId } from '@pillage-first/types/models/unit';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import {
  CombatSimulatorContext,
  type CombatSimulatorContextValue,
  type CombatSimulatorHeroStats,
  type CombatSimulatorMode,
  type CombatSimulatorParticipant,
  type CombatSimulatorParticipantReference,
  type CombatSimulatorReinforcement,
  type CombatSimulatorRemovableParticipantReference,
  type CombatSimulatorState,
  type CombatSimulatorTroop,
} from './combat-simulator-context';

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
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, Math.trunc(value)));
};

const normalizeTroops = (
  troops: CombatSimulatorTroop[],
): CombatSimulatorTroop[] => {
  return troops.map((troop) => ({
    ...troop,
    amount: clampInteger(troop.amount, 0, Number.MAX_SAFE_INTEGER),
    smithyImprovementLevel: clampInteger(troop.smithyImprovementLevel, 0, 20),
  }));
};

const setTroopSmithyImprovementLevel = (
  troops: CombatSimulatorTroop[],
  unitId: UnitId,
  smithyImprovementLevel: number,
): CombatSimulatorTroop[] => {
  return troops.map((troop) => {
    if (troop.unitId === unitId) {
      return {
        ...troop,
        smithyImprovementLevel: clampInteger(smithyImprovementLevel, 0, 20),
      };
    }

    return troop;
  });
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
    combatMode: 'raid',
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

  const setCombatMode = useCallback((combatMode: CombatSimulatorMode) => {
    setState((prevState) => ({
      ...prevState,
      combatMode,
    }));
  }, []);

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

  const setAttackerTroops = useCallback((troops: CombatSimulatorTroop[]) => {
    setState((prevState) => ({
      ...prevState,
      attacker: { ...prevState.attacker, troops: normalizeTroops(troops) },
    }));
  }, []);

  const setDefenderTroops = useCallback((troops: CombatSimulatorTroop[]) => {
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
          population: clampInteger(population, 0, Number.MAX_SAFE_INTEGER),
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
          population: clampInteger(population, 0, Number.MAX_SAFE_INTEGER),
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
      troops: CombatSimulatorTroop[],
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
                      population: clampInteger(
                        population,
                        0,
                        Number.MAX_SAFE_INTEGER,
                      ),
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

  const value = useMemo<CombatSimulatorContextValue>(
    () => ({
      state,
      setCombatMode,
      setAttackerTribe,
      setDefenderTribe,
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
      setCombatMode,
      setAttackerTribe,
      setDefenderTribe,
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
