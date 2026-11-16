import {
  calculateHeroAttackPower,
  calculateHeroEquipmentBonuses,
} from '@pillage-first/game-assets/utils/hero';
import { getItemDefinition } from '@pillage-first/game-assets/utils/items';
import type {
  CombatSimulatorHeroStats,
  CombatSimulatorParticipant,
  CombatSimulatorReinforcement,
  CombatSimulatorState,
} from '@pillage-first/types/models/combat-simulator';
import type {
  HeroItem,
  HeroItemSlot,
} from '@pillage-first/types/models/hero-item';
import type { Tribe } from '@pillage-first/types/models/tribe';

export type CombatSimulatorHeroItemSlot = Extract<
  HeroItemSlot,
  'right-hand' | 'left-hand' | 'torso'
>;

export type CombatSimulatorHeroFormValues = {
  hp: number;
  strength: number;
  attackBonus: number;
  defenceBonus: number;
  mounted: boolean;
  itemIdsBySlot: Partial<Record<CombatSimulatorHeroItemSlot, HeroItem['id']>>;
};

type WithHeroFormValues<T> = Omit<T, 'heroStats'> & {
  heroStats: CombatSimulatorHeroFormValues;
};

export type CombatSimulatorFormParticipant<TVillage> = WithHeroFormValues<
  CombatSimulatorParticipant<TVillage>
>;

export type CombatSimulatorFormReinforcement =
  WithHeroFormValues<CombatSimulatorReinforcement>;

export type CombatSimulatorFormDefender = Omit<
  WithHeroFormValues<CombatSimulatorState['defender']>,
  'reinforcements'
> & {
  reinforcements: CombatSimulatorFormReinforcement[];
};

export type CombatSimulatorFormState = Omit<
  CombatSimulatorState,
  'attacker' | 'defender'
> & {
  attacker: WithHeroFormValues<CombatSimulatorState['attacker']>;
  defender: CombatSimulatorFormDefender;
};

export const calculateSimulatorHeroStats = (
  tribe: Tribe,
  values: CombatSimulatorHeroFormValues,
): CombatSimulatorHeroStats => {
  const equippedItems: HeroItem[] = [];

  for (const [slot, itemId] of Object.entries(values.itemIdsBySlot)) {
    const item = getItemDefinition(itemId);

    if (item?.category === 'wearable' && item.slot === slot) {
      equippedItems.push(item);
    }
  }

  const bonuses = calculateHeroEquipmentBonuses(equippedItems);

  return {
    health: values.hp,
    attackPower: calculateHeroAttackPower(
      tribe,
      values.strength,
      bonuses.power,
    ),
    damageReduction: bonuses.damageReduction,
    experienceModifier: bonuses.experienceModifier,
    natarianAttackBonus: 0,
    // Persisted hero bonuses are stored in tenths of a percent (2 per skill point).
    attackBonus: values.attackBonus * 2,
    defenceBonus: values.defenceBonus * 2,
    mounted: values.mounted,
  };
};

export const toCombatSimulatorRequest = (
  state: CombatSimulatorFormState,
): CombatSimulatorState => ({
  ...state,
  attacker: {
    ...state.attacker,
    heroStats: calculateSimulatorHeroStats(
      state.attacker.tribe,
      state.attacker.heroStats,
    ),
  },
  defender: {
    ...state.defender,
    heroStats: calculateSimulatorHeroStats(
      state.defender.tribe,
      state.defender.heroStats,
    ),
    reinforcements: state.defender.reinforcements.map((reinforcement) => ({
      ...reinforcement,
      heroStats: calculateSimulatorHeroStats(
        reinforcement.tribe,
        reinforcement.heroStats,
      ),
    })),
  },
});
