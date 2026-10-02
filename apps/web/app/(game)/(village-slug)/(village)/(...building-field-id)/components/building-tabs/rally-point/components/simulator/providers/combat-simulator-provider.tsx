import {
  type PropsWithChildren,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  getUnitsByTribe,
  getUnitsByTribeWithHero,
} from '@pillage-first/game-assets/utils/units';
import type { PlayableTribe, Tribe } from '@pillage-first/types/models/tribe';
import type { UnitId } from '@pillage-first/types/models/unit';
import { useTribe } from 'app/(game)/(village-slug)/hooks/use-tribe';
import {
  CombatSimulatorContext,
  type CombatSimulatorContextValue,
  type CombatSimulatorDefender,
  type CombatSimulatorHeroItemSlot,
  type CombatSimulatorHeroStats,
  type CombatSimulatorMode,
  type CombatSimulatorParticipant,
  type CombatSimulatorReinforcement,
  type CombatSimulatorState,
  type CombatSimulatorTroop,
} from './combat-simulator-context';

const DEFAULT_HERO_STATS = {
  hp: 100,
  strength: 0,
  attackBonus: 0,
  defenceBonus: 0,
  mounted: false,
  itemIdsBySlot: {},
} satisfies CombatSimulatorHeroStats;

const heroItemSlots = new Set<CombatSimulatorHeroItemSlot>([
  'right-hand',
  'left-hand',
  'torso',
]);

const createEmptyTroops = (
  tribe: Tribe,
  includeHero = true,
): CombatSimulatorTroop[] => {
  const units = includeHero
    ? getUnitsByTribeWithHero(tribe)
    : getUnitsByTribe(tribe);

  return units.map(({ id }) => ({
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

const normalizeHeroStats = (
  heroStats: CombatSimulatorHeroStats,
): CombatSimulatorHeroStats => {
  const itemIdsBySlot = Object.fromEntries(
    Object.entries(heroStats.itemIdsBySlot).filter(([slot, itemId]) => {
      return heroItemSlots.has(slot as CombatSimulatorHeroItemSlot) && itemId;
    }),
  ) as CombatSimulatorHeroStats['itemIdsBySlot'];

  return {
    ...heroStats,
    hp: clampInteger(heroStats.hp, 1, 100),
    strength: clampInteger(heroStats.strength, 0, 100),
    attackBonus: clampInteger(heroStats.attackBonus, 0, 100),
    defenceBonus: clampInteger(heroStats.defenceBonus, 0, 100),
    itemIdsBySlot,
  };
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

const getHeroAmount = (troops: CombatSimulatorTroop[]) => {
  return troops.find((troop) => troop.unitId === 'HERO')?.amount ?? 0;
};

const setHeroAmount = (
  troops: CombatSimulatorTroop[],
  amount: number,
): CombatSimulatorTroop[] => {
  return troops.map((troop) =>
    troop.unitId === 'HERO' ? { ...troop, amount } : troop,
  );
};

const removeHeroTroop = (troops: CombatSimulatorTroop[]) => {
  return troops.filter((troop) => troop.unitId !== 'HERO');
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

const createReinforcement = (
  id: string,
  tribe: Tribe,
): CombatSimulatorReinforcement => {
  return {
    id,
    tribe,
    troops: createEmptyTroops(tribe, false),
    village: undefined,
  };
};

const createAttacker = (tribe: Tribe) => {
  return createParticipant(tribe, { breweryLevel: 0 });
};

const createDefender = (
  tribe: Tribe,
  reinforcements: CombatSimulatorReinforcement[] = [],
): CombatSimulatorDefender => {
  return {
    ...createParticipant(tribe, {
      wallLevel: 0,
      residenceLevel: 0,
      trapCount: 0,
    }),
    reinforcements,
  };
};

const createInitialCombatSimulatorState = (
  initialTribe: Tribe,
): CombatSimulatorState => {
  return {
    combatMode: 'raid',
    playerRole: 'attacker',
    attacker: createAttacker(initialTribe),
    defender: createDefender(initialTribe),
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

  const swapPlayerRole = useCallback(() => {
    setState((prevState) => {
      if (
        prevState.playerRole === 'attacker' &&
        prevState.defender.tribe === 'nature'
      ) {
        return prevState;
      }

      if (prevState.playerRole === 'attacker') {
        const heroAmount = getHeroAmount(prevState.attacker.troops);

        return {
          ...prevState,
          playerRole: 'defender',
          attacker: {
            ...prevState.attacker,
            troops: setHeroAmount(prevState.attacker.troops, 0),
            heroStats: { ...DEFAULT_HERO_STATS },
          },
          defender: {
            ...prevState.defender,
            troops: setHeroAmount(prevState.defender.troops, heroAmount),
            heroStats: prevState.attacker.heroStats,
          },
        };
      }

      const heroAmount = getHeroAmount(prevState.defender.troops);

      return {
        ...prevState,
        playerRole: 'attacker',
        attacker: {
          ...prevState.attacker,
          troops: setHeroAmount(prevState.attacker.troops, heroAmount),
          heroStats: prevState.defender.heroStats,
        },
        defender: {
          ...prevState.defender,
          troops: setHeroAmount(prevState.defender.troops, 0),
          heroStats: { ...DEFAULT_HERO_STATS },
        },
      };
    });
  }, []);

  const setAttackerTribe = useCallback((tribe: PlayableTribe) => {
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
    setState((prevState) => {
      if (tribe === 'nature' && prevState.playerRole === 'defender') {
        return prevState;
      }

      return {
        ...prevState,
        defender: {
          ...prevState.defender,
          tribe,
          troops: createEmptyTroops(tribe),
          ...(tribe === 'nature' && {
            village: {
              ...prevState.defender.village,
              wallLevel: 0,
              residenceLevel: 0,
              trapCount: 0,
            },
          }),
        },
      };
    });
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
        attacker: {
          ...prevState.attacker,
          heroStats: normalizeHeroStats(heroStats),
        },
      }));
    },
    [],
  );

  const setDefenderHeroStats = useCallback(
    (heroStats: CombatSimulatorHeroStats) => {
      setState((prevState) => ({
        ...prevState,
        defender: {
          ...prevState.defender,
          heroStats: normalizeHeroStats(heroStats),
        },
      }));
    },
    [],
  );

  const setAttackerBreweryLevel = useCallback((breweryLevel: number) => {
    setState((prevState) => ({
      ...prevState,
      attacker: {
        ...prevState.attacker,
        village: {
          ...prevState.attacker.village,
          breweryLevel: clampInteger(breweryLevel, 0, 20),
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

  const setDefenderTrapCount = useCallback((trapCount: number) => {
    setState((prevState) => ({
      ...prevState,
      defender: {
        ...prevState.defender,
        village: {
          ...prevState.defender.village,
          trapCount: clampInteger(trapCount, 0, 400),
        },
      },
    }));
  }, []);

  const clearAttackerData = useCallback(() => {
    setState((prevState) => ({
      ...prevState,
      attacker: createAttacker(prevState.attacker.tribe),
    }));
  }, []);

  const clearDefenderData = useCallback(() => {
    setState((prevState) => ({
      ...prevState,
      defender: createDefender(
        prevState.defender.tribe,
        prevState.defender.reinforcements,
      ),
    }));
  }, []);

  const addDefenderReinforcement = useCallback(
    (tribe: Tribe = initialTribe) => {
      setState((prevState) => {
        if (tribe === 'nature') {
          return prevState;
        }

        const id = `reinforcement-${nextReinforcementId.current}`;
        nextReinforcementId.current += 1;

        return {
          ...prevState,
          defender: {
            ...prevState.defender,
            reinforcements: [
              ...prevState.defender.reinforcements,
              createReinforcement(id, tribe),
            ],
          },
        };
      });
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

  const setDefenderReinforcementTribe = useCallback(
    (reinforcementId: CombatSimulatorReinforcement['id'], tribe: Tribe) => {
      if (tribe === 'nature') {
        return;
      }

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
                troops: createEmptyTroops(tribe, false),
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
                ? {
                    ...reinforcement,
                    troops: removeHeroTroop(normalizeTroops(troops)),
                  }
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
                    ...createReinforcement(
                      reinforcement.id,
                      reinforcement.tribe,
                    ),
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
      swapPlayerRole,
      setAttackerTribe,
      setDefenderTribe,
      setAttackerTroops,
      setDefenderTroops,
      setAttackerSmithyImprovementLevel,
      setDefenderSmithyImprovementLevel,
      setAttackerHeroStats,
      setDefenderHeroStats,
      setAttackerBreweryLevel,
      setDefenderWallLevel,
      setDefenderResidenceLevel,
      setDefenderTrapCount,
      clearAttackerData,
      clearDefenderData,
      addDefenderReinforcement,
      removeDefenderReinforcement,
      setDefenderReinforcementTribe,
      setDefenderReinforcementTroops,
      setDefenderReinforcementSmithyImprovementLevel,
      clearDefenderReinforcementData,
    }),
    [
      state,
      setCombatMode,
      swapPlayerRole,
      setAttackerTribe,
      setDefenderTribe,
      setAttackerTroops,
      setDefenderTroops,
      setAttackerSmithyImprovementLevel,
      setDefenderSmithyImprovementLevel,
      setAttackerHeroStats,
      setDefenderHeroStats,
      setAttackerBreweryLevel,
      setDefenderWallLevel,
      setDefenderResidenceLevel,
      setDefenderTrapCount,
      clearAttackerData,
      clearDefenderData,
      addDefenderReinforcement,
      removeDefenderReinforcement,
      setDefenderReinforcementTribe,
      setDefenderReinforcementTroops,
      setDefenderReinforcementSmithyImprovementLevel,
      clearDefenderReinforcementData,
    ],
  );

  return (
    <CombatSimulatorContext value={value}>{children}</CombatSimulatorContext>
  );
};
