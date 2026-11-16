import { describe, expect, test } from 'vitest';
import { getItemByName } from '@pillage-first/game-assets/utils/items';
import { combatSimulatorReportDtoSchema } from '@pillage-first/types/dtos/combat-simulator';
import { battleHeroOutcomeSchema } from '@pillage-first/types/models/battle';
import { combatSimulatorStateSchema } from '@pillage-first/types/models/combat-simulator';
import {
  type CombatSimulatorFormState,
  type CombatSimulatorHeroFormValues,
  calculateSimulatorHeroStats,
  toCombatSimulatorRequest,
} from '../combat-simulator-form';

const heroValues: CombatSimulatorHeroFormValues = {
  hp: 75,
  strength: 10,
  attackBonus: 25,
  defenceBonus: 100,
  mounted: true,
  itemIdsBySlot: {
    'right-hand': getItemByName('COMMON_SWORD').id,
    'left-hand': getItemByName('RARE_SHIELD').id,
    torso: getItemByName('UNCOMMON_MAIL_BODY_ARMOR').id,
  },
};

describe('simulator hero normalization', () => {
  test('calculates effective power, equipment defence and fixed-point army bonuses', () => {
    expect(calculateSimulatorHeroStats('romans', heroValues)).toEqual({
      health: 75,
      attackPower: 1400,
      damageReduction: 8,
      experienceModifier: 0,
      natarianAttackBonus: 0,
      attackBonus: 50,
      defenceBonus: 200,
      mounted: true,
    });
    expect(calculateSimulatorHeroStats('gauls', heroValues).attackPower).toBe(
      1180,
    );
  });

  test('recalculates when tribe, points or equipment change', () => {
    const values = { ...heroValues, strength: 0, itemIdsBySlot: {} };
    expect(calculateSimulatorHeroStats('romans', values).attackPower).toBe(100);
    expect(calculateSimulatorHeroStats('teutons', values).attackPower).toBe(80);
    expect(calculateSimulatorHeroStats('teutons', values).damageReduction).toBe(
      0,
    );
    expect(heroValues.strength).toBe(10);
  });

  test('converts every contingent and sends no skill points or equipment IDs', () => {
    const participant = {
      ownerId: null,
      homeVillageId: null,
      tribe: 'romans' as const,
      troops: [
        { unitId: 'HERO' as const, amount: 1, smithyImprovementLevel: 0 },
      ],
      heroStats: heroValues,
    };
    const form: CombatSimulatorFormState = {
      combatMode: 'attack',
      playerRole: 'defender',
      attacker: { ...participant, village: { breweryLevel: 0 } },
      defender: {
        ...participant,
        village: { wallLevel: 0, residenceLevel: 0, trapCount: 0 },
        reinforcements: [
          { ...participant, id: 'reinforcement-1', tribe: 'gauls' },
        ],
      },
    };
    const request = combatSimulatorStateSchema.parse(
      toCombatSimulatorRequest(form),
    );
    expect(request.attacker.heroStats.attackPower).toBe(1400);
    expect(request.defender.heroStats.defenceBonus).toBe(200);
    expect(request.defender.reinforcements[0].heroStats.attackPower).toBe(1180);
    expect(request.attacker.heroStats).not.toHaveProperty('strength');
    expect(request.attacker.heroStats).not.toHaveProperty('itemIdsBySlot');
    expect(form.attacker.heroStats).toEqual(heroValues);
    expect(combatSimulatorStateSchema.safeParse(form).success).toBe(false);
  });
});

describe('simulator hero outcomes', () => {
  const outcome = {
    healthBefore: 75,
    healthAfter: 50,
    experienceGained: 10,
    consumables: [],
  };
  const battle = combatSimulatorReportDtoSchema.shape.battle.shape;

  test('allows hero outcomes without IDs on both sides and reinforcements', () => {
    for (const schema of [
      battle.attacker.shape.hero,
      battle.defender.shape.hero,
      battle.defender.shape.reinforcements.element.shape.hero,
    ]) {
      expect(schema.parse(outcome)).toEqual(outcome);
      expect(schema.parse(null)).toBeNull();
    }
  });

  test('keeps database hero identity mandatory for persisted outcomes', () => {
    expect(battleHeroOutcomeSchema.safeParse(outcome).success).toBe(false);
    expect(
      battleHeroOutcomeSchema.parse({ ...outcome, heroId: 1 }).heroId,
    ).toBe(1);
  });
});
