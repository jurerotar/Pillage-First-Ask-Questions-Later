import { z } from 'zod';
import type { HeroItem, HeroItemSlot } from './hero-item';
import { type Player, playerSchema } from './player';
import { type Tribe, tribeSchema } from './tribe';
import type { TroopLike } from './troop';
import { unitIdSchema } from './unit';
import { type Village, villageSchema } from './village';

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
  /** Village-based Brewery level: 0 means no active celebration; a positive level means an active celebration. */
  breweryLevel: number;
};

export type CombatSimulatorDefenderVillage = {
  wallLevel: number;
  residenceLevel: number;
  trapCount: number;
};

export type CombatSimulatorParticipant<TVillage> = {
  /** Null means a hypothetical owner; null owners must not share hero bonuses. */
  ownerId: Player['id'] | null;
  /** Origin village of this contingent, not the village being defended. */
  homeVillageId: Village['id'] | null;
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

export const combatSimulatorTroopSchema = z
  .strictObject({
    unitId: unitIdSchema,
    amount: z.int().nonnegative(),
    smithyImprovementLevel: improvementLevelSchema,
  })
  .refine(({ unitId, amount }) => unitId !== 'HERO' || amount <= 1, {
    message: 'A contingent can include at most one hero',
    path: ['amount'],
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
  // Database player/village IDs; null denotes an unassigned simulator identity.
  ownerId: playerSchema.shape.id.int().positive().nullable(),
  homeVillageId: villageSchema.shape.id.int().positive().nullable(),
  tribe: tribeSchema,
  troops: z.array(combatSimulatorTroopSchema),
  // Stats only apply when this contingent includes a HERO troop.
  heroStats: combatSimulatorHeroStatsSchema,
});

export const combatSimulatorStateSchema = z
  .strictObject({
    combatMode: z.enum(['attack', 'raid']),
    playerRole: z.enum(['attacker', 'defender']),
    attacker: participantSchema.extend({
      village: z.strictObject({
        // Village-based bonus; a positive level implies an active celebration.
        breweryLevel: improvementLevelSchema,
      }),
    }),
    defender: participantSchema.extend({
      village: z.strictObject({
        wallLevel: improvementLevelSchema,
        residenceLevel: improvementLevelSchema,
        trapCount: z.int().min(0).max(10_000),
      }),
      reinforcements: z.array(
        participantSchema.extend({
          id: z.string(),
          village: z.undefined().optional(),
        }),
      ),
    }),
  })
  .superRefine(({ attacker, defender }, ctx) => {
    const heroOwners = new Set<Player['id']>();
    const participants = [
      { participant: attacker, path: ['attacker'] },
      { participant: defender, path: ['defender'] },
      ...defender.reinforcements.map((participant, index) => ({
        participant,
        path: ['defender', 'reinforcements', index],
      })),
    ];

    for (const { participant, path } of participants) {
      let heroes = 0;

      for (const troop of participant.troops) {
        if (troop.unitId === 'HERO') {
          heroes += troop.amount;
        }
      }

      if (heroes > 1) {
        ctx.addIssue({
          code: 'custom',
          path: [...path, 'troops'],
          message: 'A contingent can include at most one hero',
        });
      }

      if (heroes === 0 || participant.ownerId === null) {
        continue;
      }

      if (heroOwners.has(participant.ownerId)) {
        ctx.addIssue({
          code: 'custom',
          path: [...path, 'troops'],
          message: 'A player can have at most one participating hero',
        });
      }

      heroOwners.add(participant.ownerId);
    }
  });
