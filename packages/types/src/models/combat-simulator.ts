import { z } from 'zod';
import type { HeroItem, HeroItemSlot } from './hero-item';
import { type Tribe, tribeSchema } from './tribe';
import type { TroopLike } from './troop';
import { unitIdSchema } from './unit';

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

export type CombatSimulatorReinforcement =
  CombatSimulatorState['defender']['reinforcements'][number];

export type CombatSimulatorDefender =
  CombatSimulatorParticipant<CombatSimulatorDefenderVillage> & {
    reinforcements: CombatSimulatorReinforcement[];
  };

export type CombatSimulatorState = z.infer<typeof combatSimulatorStateSchema>;

const improvementLevelSchema = z.int().min(0).max(20);

export const combatSimulatorTroopSchema = z.strictObject({
  unitId: unitIdSchema,
  amount: z.int().nonnegative(),
  smithyImprovementLevel: improvementLevelSchema,
});

export const combatSimulatorHeroStatsSchema = z.strictObject({
  hp: z.int().min(1).max(100),
  strength: z.int().min(0).max(100),
  attackBonus: z.int().min(0).max(100),
  defenceBonus: z.int().min(0).max(100),
  mounted: z.boolean(),
  itemIdsBySlot: z.strictObject({
    'right-hand': z.number().optional(),
    'left-hand': z.number().optional(),
    torso: z.number().optional(),
  }),
});

const participantSchema = z.strictObject({
  tribe: tribeSchema,
  troops: z.array(combatSimulatorTroopSchema),
  heroStats: combatSimulatorHeroStatsSchema,
});

export const combatSimulatorStateSchema = z.strictObject({
  combatMode: z.enum(['attack', 'raid']),
  playerRole: z.enum(['attacker', 'defender']),
  attacker: participantSchema.extend({
    village: z.strictObject({ breweryLevel: improvementLevelSchema }),
  }),
  defender: participantSchema.extend({
    village: z.strictObject({
      wallLevel: improvementLevelSchema,
      residenceLevel: improvementLevelSchema,
      trapCount: z.int().min(0).max(400),
    }),
    reinforcements: z.array(
      participantSchema.omit({ heroStats: true }).extend({
        id: z.string(),
        village: z.undefined().optional(),
      }),
    ),
  }),
});
