import { describe, expect, test } from 'vitest';
import {
  type BattleModifiers,
  type BattleSide,
  resolveBattle,
} from '../battle';

const noBonuses: BattleModifiers = {
  wallDefenceBonus: 1,
  wallDefenceBase: 0,
  moralBonus: 1,
  oasisDefenceBonus: 0,
  attackerType: 'attack',
};

const side = (troops: BattleSide['troops']): BattleSide => ({ troops });

describe('resolveBattle', () => {
  test('attacker wins decisively against empty defender', () => {
    const result = resolveBattle(
      side([{ unitId: 'LEGIONNAIRE', amount: 100 }]),
      side([]),
      noBonuses,
    );

    expect(result.outcome).toBe('attacker-wins');
    expect(result.attackerLossRate).toBe(0);
    expect(result.attackerLosses).toEqual([
      { unitId: 'LEGIONNAIRE', amount: 100, losses: 0 },
    ]);
    expect(result.defencePower).toBe(0);
    expect(result.attackPower).toBe(4000);
  });

  test('defender wins decisively against empty attacker', () => {
    const result = resolveBattle(
      side([]),
      side([{ unitId: 'PHALANX', amount: 100 }]),
      noBonuses,
    );

    expect(result.outcome).toBe('defender-wins');
    expect(result.defenderLossRate).toBe(0);
  });

  test('both empty sides yield a draw with zero losses', () => {
    const result = resolveBattle(side([]), side([]), noBonuses);
    expect(result.outcome).toBe('draw');
    expect(result.attackerLossRate).toBe(0);
    expect(result.defenderLossRate).toBe(0);
  });

  test('attacker stronger than defender takes proportional losses, defender is wiped', () => {
    // 100 LEGIONNAIRE = 100 * 40 attack = 4000 (pure infantry → infantryShare=1)
    // 50 PHALANX = 50 * 40 (inf def) = 2000
    const result = resolveBattle(
      side([{ unitId: 'LEGIONNAIRE', amount: 100 }]),
      side([{ unitId: 'PHALANX', amount: 50 }]),
      noBonuses,
    );

    expect(result.outcome).toBe('attacker-wins');
    expect(result.defenderLossRate).toBe(1);
    expect(result.defenderLosses[0].losses).toBe(50);
    expect(result.attackerLossRate).toBeCloseTo((2000 / 4000) ** 1.5, 5);
    expect(result.attackerLosses[0].losses).toBeGreaterThan(0);
    expect(result.attackerLosses[0].losses).toBeLessThan(100);
  });

  test('defender stronger: attacker wiped, defender takes proportional losses', () => {
    const result = resolveBattle(
      side([{ unitId: 'LEGIONNAIRE', amount: 10 }]),
      side([{ unitId: 'PHALANX', amount: 100 }]),
      noBonuses,
    );

    expect(result.outcome).toBe('defender-wins');
    expect(result.attackerLossRate).toBe(1);
    expect(result.attackerLosses[0].losses).toBe(10);
  });

  test('losses are distributed proportionally across multiple unit types', () => {
    // Defender mix: 100 PHALANX + 20 DRUIDRIDER, attacker overwhelmingly strong.
    // All defenders should be wiped (lossRate = 1).
    const result = resolveBattle(
      side([{ unitId: 'EQUITES_CAESARIS', amount: 200 }]), // 200*180 = 36000 atk
      side([
        { unitId: 'PHALANX', amount: 100 },
        { unitId: 'DRUIDRIDER', amount: 20 },
      ]),
      noBonuses,
    );

    expect(result.outcome).toBe('attacker-wins');
    expect(result.defenderLossRate).toBe(1);
    expect(result.defenderLosses).toEqual([
      { unitId: 'PHALANX', amount: 100, losses: 100 },
      { unitId: 'DRUIDRIDER', amount: 20, losses: 20 },
    ]);
  });

  test('raid halves both loss rates compared to attack', () => {
    const attackers = side([{ unitId: 'LEGIONNAIRE', amount: 100 }]);
    const defenders = side([{ unitId: 'PHALANX', amount: 50 }]);

    const attack = resolveBattle(attackers, defenders, noBonuses);
    const raid = resolveBattle(attackers, defenders, {
      ...noBonuses,
      attackerType: 'raid',
    });

    expect(raid.outcome).toBe('attacker-wins');
    expect(raid.attackerLossRate).toBeCloseTo(attack.attackerLossRate * 0.5, 5);
    expect(raid.defenderLossRate).toBeCloseTo(attack.defenderLossRate * 0.5, 5);
  });

  test('wall bonus shifts outcome', () => {
    // 100 LEGIONNAIRE = 4000 attack
    // 100 PHALANX = 100 * 40 (inf def of PHALANX) = 4000 base defence... let's check.
    // Actually PHALANX infantryDefence is 40 per game-assets/units.ts:
    //   PHALANX entry has infantryDefence: 40 (gaul tier-1).
    // So 100 PHALANX = 4000 inf def. With wall x1.5 +200 = 6200 effective.
    const attackers = side([{ unitId: 'LEGIONNAIRE', amount: 100 }]);
    const defenders = side([{ unitId: 'PHALANX', amount: 100 }]);

    const withoutWall = resolveBattle(attackers, defenders, noBonuses);
    const withWall = resolveBattle(attackers, defenders, {
      ...noBonuses,
      wallDefenceBonus: 1.5,
      wallDefenceBase: 200,
    });

    expect(withWall.defencePower).toBeGreaterThan(withoutWall.defencePower);
  });

  test('cavalry attacker is countered by cavalry defence', () => {
    // EQUITES_IMPERATORIS attack = 120 (cavalry)
    // PHALANX cavalryDefence = 50 vs infantryDefence = 40
    // So vs cavalry attacker, defence weight uses cavalryDefence (=50)
    const cavalryRaid = resolveBattle(
      side([{ unitId: 'EQUITES_IMPERATORIS', amount: 50 }]),
      side([{ unitId: 'PHALANX', amount: 100 }]),
      noBonuses,
    );

    const infantryRaid = resolveBattle(
      side([{ unitId: 'LEGIONNAIRE', amount: 150 }]),
      side([{ unitId: 'PHALANX', amount: 100 }]),
      noBonuses,
    );

    // Both attackers have same attack: 50*120 = 6000 vs 150*40 = 6000
    expect(cavalryRaid.attackPower).toBe(infantryRaid.attackPower);
    // But defender uses different defence values per attacker mix
    expect(cavalryRaid.defencePower).not.toBe(infantryRaid.defencePower);
  });
});
