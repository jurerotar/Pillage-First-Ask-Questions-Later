import { z } from 'zod';
import {
  battleHeroOutcomeSchema,
  battleSchema,
  battleTroopsSchema,
} from './battle';
import { playerSchema } from './player';
import { tribeSchema } from './tribe';
import { unitIdSchema } from './unit';
import { villageSchema } from './village';

export const combatModeSchema = z.enum(['attack', 'raid']);

const improvementLevelSchema = z.int().min(0).max(20);

const combatTroopSchema = z
  .strictObject({
    unitId: unitIdSchema,
    amount: z.int().nonnegative(),
    smithyImprovementLevel: improvementLevelSchema,
  })
  .refine(({ unitId, amount }) => unitId !== 'HERO' || amount <= 1, {
    message: 'A contingent can include at most one hero',
    path: ['amount'],
  });

export const combatHeroStatsSchema = z.strictObject({
  health: z.int().min(1).max(100),
  // Effective values include equipment bonuses; the engine must not add them again.
  attackPower: z.int().nonnegative(),
  damageReduction: z.int().nonnegative(),
  experienceModifier: z.int().nonnegative(),
  natarianAttackBonus: z.int().nonnegative(),
  // Tenths of a percent, matching heroes.attack_bonus / defence_bonus in the DB.
  attackBonus: z.int().min(0).max(200),
  defenceBonus: z.int().min(0).max(200),
  mounted: z.boolean(),
});

export const combatParticipantSchema = z.strictObject({
  // Database player/village IDs; null denotes an unassigned simulator identity.
  ownerId: playerSchema.shape.id.int().positive().nullable(),
  homeVillageId: villageSchema.shape.id.int().positive().nullable(),
  tribe: tribeSchema,
  troops: z.array(combatTroopSchema),
  // Stats only apply when this contingent includes a HERO troop.
  heroStats: combatHeroStatsSchema,
});

const combatParticipantResultSchema = z.strictObject({
  ...battleTroopsSchema.omit({ id: true }).shape,
  hero: battleHeroOutcomeSchema.omit({ heroId: true }).nullable(),
});

export const combatAttackerVillageSchema = z.strictObject({
  // A positive Brewery level implies an active celebration.
  breweryLevel: improvementLevelSchema,
});

export const combatDefenderVillageSchema = z.strictObject({
  wallLevel: z.int().nonnegative(),
  residenceLevel: z.int().nonnegative(),
  trapCount: z.int().nonnegative(),
});

export const combatResultSchema = z.strictObject({
  ...battleSchema.omit({ id: true }).shape,
  attacker: combatParticipantResultSchema,
  defender: z.strictObject({
    ...combatParticipantResultSchema.shape,
    reinforcements: z.array(
      z.strictObject({
        ...combatParticipantResultSchema.shape,
        id: z.string(),
      }),
    ),
  }),
});

export type CombatHeroStats = z.infer<typeof combatHeroStatsSchema>;
export type CombatMode = z.infer<typeof combatModeSchema>;
export type CombatParticipant = z.infer<typeof combatParticipantSchema>;
export type CombatResult = z.infer<typeof combatResultSchema>;
export type CombatTroop = z.infer<typeof combatTroopSchema>;

export const combatInputSchema = z
  .strictObject({
    combatMode: combatModeSchema,
    attacker: z.strictObject({
      ...combatParticipantSchema.shape,
      village: combatAttackerVillageSchema,
    }),
    defender: z.strictObject({
      ...combatParticipantSchema.shape,
      village: combatDefenderVillageSchema.extend({
        wallLevel: combatDefenderVillageSchema.shape.wallLevel.max(20),
        residenceLevel:
          combatDefenderVillageSchema.shape.residenceLevel.max(20),
        trapCount: combatDefenderVillageSchema.shape.trapCount.max(10_000),
      }),
      reinforcements: z.array(
        z.strictObject({
          ...combatParticipantSchema.shape,
          id: z.string(),
          village: z.undefined().optional(),
        }),
      ),
    }),
  })
  .superRefine(({ attacker, defender }, ctx) => {
    const heroOwners = new Set<number>();
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

export type CombatInput = z.infer<typeof combatInputSchema>;
